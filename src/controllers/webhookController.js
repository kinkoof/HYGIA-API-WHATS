const { sendWhatsAppMessage, sendWhatsAppList } = require('../services/whatsappService');
const db = require('../config/db');
const userFlows = require('../state/userFlows');
const { createOrder } = require('./createOrderController');

// Verificação do webhook
exports.verifyWebhook = (req, res) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            console.log('Webhook verified');
            return res.status(200).send(challenge);
        } else {
            return res.status(403).send('Forbidden');
        }
    }
    res.status(400).send('Bad Request');
};

// Tratamento das mensagens recebidas
exports.handleMessage = (req, res) => {
    const body = req.body;
    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const messageObject = entry?.messages?.[0];

    if (!messageObject) {
        console.log('Mensagem não encontrada.');
        return res.sendStatus(404);
    }

    const { phone_number_id } = entry.metadata;
    const from = messageObject.from;

    console.log('Mensagem recebida:', messageObject);
    console.log('Estado do usuário:', userFlows[from]);

    if (messageObject.interactive?.type === 'button_reply') {
        const buttonResponse = messageObject.interactive.button_reply.id;
        console.log(`Interação do usuário ${from}: ${buttonResponse}`);

        if (buttonResponse === 'buy') {
            if (userFlows[from]?.status === 'cart') {
                continueShopping(phone_number_id, from, res);
            } else {
                startBuyFlow(phone_number_id, from, res);
            }
        } else if (buttonResponse === 'checkout') {
            askForLocation(phone_number_id, from, res);
        } else if (buttonResponse === 'confirm_purchase') {
            confirmPurchase(phone_number_id, from, res);
        } else {
            res.sendStatus(200);
        }
    }
    else if (messageObject.interactive?.type === 'list_reply') {
        const selectedProductId = messageObject.interactive.list_reply.id;
        console.log(`Produto selecionado pelo usuário ${from}: ${selectedProductId}`);

        if (userFlows[from]?.status === 'awaiting_product') {
            addToCart(phone_number_id, from, selectedProductId, res);
        } else {
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, inicie uma compra para selecionar um produto.', res);
        }
    }
    else if (messageObject.text) {
        const userText = messageObject.text.body.toLowerCase();

        if (!userFlows[from]) {
            userFlows[from] = { status: 'awaiting_product', cart: [] };
            sendWelcomeOptions(phone_number_id, from, res);
            return;
        }

        if (userFlows[from]?.status === 'awaiting_product') {
            if (userText.trim() === '') {
                sendWhatsAppMessage(phone_number_id, from, 'Por favor, informe o nome do produto que deseja comprar.', res);
            } else {
                processBuyRequest(phone_number_id, from, userText, res);
            }
        } else if (userFlows[from]?.status === 'cart') {
            if (userText === 'continuar') {
                continueShopping(phone_number_id, from, res);
            } else if (userText === 'finalizar') {
                askForLocation(phone_number_id, from, res);
            } else {
                sendWhatsAppMessage(phone_number_id, from, 'Resposta inválida. Por favor, responda com "continuar" ou "finalizar".', res);
            }
        } else {
            sendWelcomeOptions(phone_number_id, from, res);
        }
    }
    else if (messageObject.location) {  // Adicionando verificação para localização
        const location = messageObject.location;
        console.log(`Localização recebida do usuário ${from}:`, location);

        if (userFlows[from]?.status === 'awaiting_location') {
            processLocation(phone_number_id, from, location, res);  // Chama processLocation com os dados de localização
        } else {
            sendWhatsAppMessage(phone_number_id, from, 'Localização recebida, mas nenhuma compra em andamento.', res);
        }
    }
};

// Inicia o fluxo de compra
const startBuyFlow = (phone_number_id, from, res) => {
    if (!userFlows[from]) {
        userFlows[from] = { status: 'awaiting_product', cart: [] }; // Inicializa o carrinho vazio
    }
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, informe o nome do produto que deseja comprar.', res);
};

// Continuação da compra
const continueShopping = (phone_number_id, from, res) => {
    userFlows[from].status = 'awaiting_product'; // Atualiza o status para aguardar um novo produto
    sendWhatsAppMessage(phone_number_id, from, 'Ótimo! Continue escolhendo os produtos que deseja.', res);
};

// Envia as opções de boas-vindas
const sendWelcomeOptions = (phone_number_id, from, res) => {
    sendWhatsAppMessage(phone_number_id, from, 'Bem-vindo ao Hygia, como podemos te ajudar hoje?', res, [
        { id: 'buy', title: 'Comprar medicamentos' },
        { id: 'login', title: 'Entrar em sua conta' },
        { id: 'register', title: 'Se registrar' }
    ], false, 'Bem-vindo ao Hygia');
};

// Solicita a localização do usuário
const askForLocation = (phone_number_id, from, res) => {
    userFlows[from].status = 'awaiting_location';  // Altera o status para aguardar a localização
    sendWhatsAppMessage(
        phone_number_id,
        from,
        'Por favor, envie sua localização para finalizar a compra.',
        res,
        null,
        true
    );
};

const processLocation = async (phone_number_id, from, location, res) => {
    if (!userFlows[from] || userFlows[from].status !== 'awaiting_location') {
        return;
    }

    // Extraindo latitude, longitude e endereço da localização recebida
    const latitude = location.latitude;
    const longitude = location.longitude;
    const address = location.name || `${latitude}, ${longitude}`;

    // Obtendo o carrinho do usuário
    const cart = userFlows[from]?.cart;
    if (!cart || cart.length === 0) {
        sendWhatsAppMessage(phone_number_id, from, 'Seu carrinho está vazio, não foi possível registrar o pedido.', res);
        return;
    }

    // Calculando o total do pedido
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);

    try {
        // Criando o novo pedido no banco de dados com todos os dados
        const [orderResult] = await db.execute(
            `INSERT INTO orders (user_id, latitude, longitude, address, total, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [from, latitude, longitude, address, total]
        );

        if (orderResult.affectedRows === 0) {
            console.error('Erro ao criar o pedido no banco de dados.');
            sendWhatsAppMessage(phone_number_id, from, 'Erro ao registrar seu pedido. Tente novamente mais tarde.', res);
            return;
        }

        const orderId = orderResult.insertId;

        // Agora, associamos os produtos ao pedido (se necessário)
        for (let item of cart) {
            await db.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.id, 1, item.price] // Aqui estamos assumindo quantidade 1, pode ajustar conforme necessário
            );
        }

        // Mensagem confirmando a criação do pedido
        sendWhatsAppMessage(
            phone_number_id,
            from,
            `Pedido confirmado! Total: R$${total}. Aguardando confirmação da farmácia. Em breve, você receberá mais detalhes.`,
            res
        );

        console.log(`Pedido ${orderId} criado com sucesso para o usuário ${from}.`);

        // Limpa o carrinho do usuário após a compra
        delete userFlows[from];

    } catch (error) {
        console.error('Erro ao processar a localização e criar o pedido:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Houve um erro ao salvar sua localização e criar o pedido. Tente novamente mais tarde.', res);
    }
};

// Adiciona produto ao carrinho com o pharmacyId
const addToCart = async (phone_number_id, from, selectedProductId, res) => {
    console.log(`Usuário ${from} tentou adicionar o produto ${selectedProductId} ao carrinho.`);
    const productId = selectedProductId.replace('product_', '');

    if (!userFlows[from]) {
        userFlows[from] = { status: 'awaiting_product', cart: [] };
    }

    try {
        const [rows] = await db.execute(
            `SELECT id, name, price, pharmacy FROM products WHERE id = ?`,
            [productId]
        );

        if (rows.length === 0) {
            console.log(`Produto não encontrado para o ID: ${productId}`);
            sendWhatsAppMessage(phone_number_id, from, 'Produto não encontrado. Tente novamente.', res);
            return;
        }

        const product = rows[0];
        const cartItem = { id: product.id, name: product.name, price: product.price, pharmacy: product.pharmacy };

        // Adicionando ao carrinho
        userFlows[from].cart.push(cartItem);
        sendWhatsAppMessage(phone_number_id, from, `${product.name} adicionado ao seu carrinho!`, res);

    } catch (error) {
        console.error('Erro ao adicionar produto ao carrinho:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Erro ao adicionar o produto ao carrinho. Tente novamente.', res);
    }
};

const confirmPurchase = async (phone_number_id, from, res) => {
    console.log(`Usuário ${from} confirmou a compra.`);
    // Chama o processo para confirmar a compra aqui, como a criação de um pedido, etc.
    sendWhatsAppMessage(phone_number_id, from, 'Compra confirmada! Vamos finalizar com a entrega.', res);
};
