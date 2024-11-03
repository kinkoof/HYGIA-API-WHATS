const { sendWhatsAppMessage, sendWhatsAppList } = require('../services/whatsappService');
const db = require('../config/db');
const userFlows = require('../state/userFlows');

// Verificação do Webhook
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
const { sendWhatsAppMessage, sendWhatsAppList } = require('../services/whatsappService');
const db = require('../config/db');
const userFlows = require('../state/userFlows');

// Verificação do Webhook
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

    // Verificação se é uma resposta de botão
    if (messageObject.interactive?.type === 'button_reply') {
        const buttonResponse = messageObject.interactive.button_reply.id;
        console.log(`Interação do usuário ${from}: ${buttonResponse}`);

        if (buttonResponse === 'buy') {
            // Se o usuário já estiver no fluxo de compra, confirma que ele pode continuar
            if (userFlows[from]?.status === 'cart') {
                sendWhatsAppMessage(phone_number_id, from, 'Você está no processo de compra. Por favor, informe o nome do produto que deseja adicionar ao carrinho.', res);
            } else {
                startBuyFlow(phone_number_id, from, res);
            }
        } else if (buttonResponse === 'checkout') {
            showCart(phone_number_id, from, res);
        } else if (buttonResponse === 'confirm_purchase') {
            confirmPurchase(phone_number_id, from, res);
        } else {
            res.sendStatus(200);
        }
    } else if (messageObject.text) {
        const userText = messageObject.text.body.toLowerCase();

        // Inicializa o fluxo do usuário se não existir
        if (!userFlows[from]) {
            userFlows[from] = { status: 'awaiting_product', cart: [] };
            sendWelcomeOptions(phone_number_id, from, res); // Envia as opções de boas-vindas
            return; // Sai da função para evitar qualquer processamento adicional
        }

        if (userFlows[from]?.status === 'awaiting_product') {
            if (userText.trim() === '') {
                sendWhatsAppMessage(phone_number_id, from, 'Por favor, informe o nome do produto que deseja comprar.', res);
            } else {
                // Processa a solicitação de compra se o usuário fornecer um nome de produto
                processBuyRequest(phone_number_id, from, userText, res);
            }
        } else if (userFlows[from]?.status === 'cart') {
            // Aqui verificamos a resposta do usuário na fase do carrinho
            if (userText === 'continuar') {
                userFlows[from].status = 'awaiting_product'; // Altera o estado para solicitar o nome do produto
                sendWhatsAppMessage(phone_number_id, from, 'Por favor, informe o nome do produto que deseja comprar.', res);
            } else if (userText === 'finalizar') {
                showCart(phone_number_id, from, res);
            } else {
                sendWhatsAppMessage(phone_number_id, from, 'Resposta inválida. Por favor, responda com "continuar" ou "finalizar".', res);
            }
        } else {
            sendWelcomeOptions(phone_number_id, from, res);
        }
    }
    // Verificação se é uma resposta de lista
    else if (messageObject.interactive?.type === 'list_reply') {
        const selectedProductId = messageObject.interactive.list_reply.id;
        console.log(`Produto selecionado pelo usuário ${from}: ${selectedProductId}`);

        if (userFlows[from]?.status === 'awaiting_product') {
            addToCart(phone_number_id, from, selectedProductId, res);
        } else {
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, inicie uma compra para selecionar um produto.', res);
        }
    }
};

// Iniciar fluxo de compra
const startBuyFlow = (phone_number_id, from, res) => {
    // Não inicializa o carrinho novamente, se já estiver no fluxo de compra
    if (!userFlows[from]) {
        userFlows[from] = { status: 'awaiting_product', cart: [] }; // Inicializa o carrinho vazio
    }
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, informe o nome do produto que deseja comprar.', res);
};

// Função para enviar opções de boas-vindas
const sendWelcomeOptions = (phone_number_id, from, res) => {
    sendWhatsAppMessage(phone_number_id, from, 'Bem-vindo ao Hygia, como podemos te ajudar hoje?', res, [
        { id: 'buy', title: 'Comprar medicamentos' },
        { id: 'login', title: 'Entrar em sua conta' },
        { id: 'register', title: 'Se registrar' }
    ], false, 'Bem-vindo ao Hygia');
};

const addToCart = async (phone_number_id, from, selectedProductId, res) => {
    console.log(`Usuário ${from} tentou adicionar o produto ${selectedProductId} ao carrinho.`);
    const productId = selectedProductId.replace('product_', '');

    // Inicializa o fluxo do usuário se não existir
    if (!userFlows[from]) {
        userFlows[from] = { status: 'awaiting_product', cart: [] };
    }

    try {
        const [rows] = await db.execute(
            `SELECT id, name, price FROM products WHERE id = ?`,
            [productId]
        );

        if (rows.length === 0) {
            console.log(`Produto não encontrado para o ID: ${productId}`);
            sendWhatsAppMessage(phone_number_id, from, 'Produto não encontrado.', res);
            return;
        }

        const product = rows[0];

        // Adiciona o produto ao carrinho do usuário
        userFlows[from].cart.push(product); // Isso mantém os produtos no carrinho

        userFlows[from].status = 'cart'; // Atualiza o estado para 'cart'
        console.log(`Produto ${product.name} adicionado ao carrinho do usuário ${from}.`);

        sendWhatsAppMessage(phone_number_id, from, `Produto ${product.name} adicionado ao carrinho. Deseja continuar comprando ou finalizar a compra?`, res, [
            { id: 'buy', title: 'Continuar comprando' },
            { id: 'checkout', title: 'Finalizar compra' }
        ], false, 'Carrinho Atualizado');
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Erro ao adicionar o produto ao carrinho. Tente novamente.', res);
    }
};

// Mostrar o carrinho e opção para finalizar a compra
const showCart = (phone_number_id, from, res) => {
    const cart = userFlows[from]?.cart;

    if (!cart || cart.length === 0) {
        sendWhatsAppMessage(phone_number_id, from, 'Seu carrinho está vazio.', res);
        return;
    }

    const cartSummary = cart.map((item, index) => `${index + 1}. ${item.name} - R$${item.price.toFixed(2)}`).join('\n');
    const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

    // Em seguida, envia a mensagem com os botões
    sendWhatsAppMessage(phone_number_id, from, `Itens no seu carrinho:\n${cartSummary}\n\nTotal: R$${total}`, res, [
        { id: 'buy', title: 'Continuar comprando' },
        { id: 'confirm_purchase', title: 'Finalizar compra' }
    ], false, 'Resumo do Carrinho');
};

// Confirmar e finalizar a compra
const confirmPurchase = (phone_number_id, from, res) => {
    const cart = userFlows[from]?.cart;

    if (!cart || cart.length === 0) {
        sendWhatsAppMessage(phone_number_id, from, 'Seu carrinho está vazio.', res);
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

    sendWhatsAppMessage(phone_number_id, from, `Compra confirmada! Total: R$${total}. Obrigado por comprar conosco!`, res);

    // Limpa o carrinho após a compra
    delete userFlows[from];
};


// Processar a solicitação de compra e mostrar produtos
const processBuyRequest = async (phone_number_id, from, productName, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT p.id, p.name, p.price
            FROM products p
            WHERE LOWER(p.name) LIKE ?`,
            [`%${productName.toLowerCase()}%`]
        );

        if (rows.length === 0) {
            sendWhatsAppMessage(phone_number_id, from, 'Nenhum produto encontrado com esse nome. Tente novamente.', res);
            return;
        }

        // Mostra os produtos encontrados para o usuário
        const productOptions = rows.map(product => ({
            id: `product_${product.id}`,
            title: product.name,
            description: `R$${product.price.toFixed(2)}`
        }));

        sendWhatsAppList(phone_number_id, from, productOptions, 'Selecione um produto para adicionar ao carrinho:', res);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Erro ao buscar produtos. Tente novamente.', res);
    }
};

// Enviar link de registro
const sendRegisterLink = (phone_number_id, from, res) => {
    const registrationLink = 'https://hygia-front-whats.vercel.app/auth/register';
    sendWhatsAppMessage(phone_number_id, from, `Para se registrar, acesse o seguinte link: ${registrationLink}`, res);
};

// Enviar link de login
const sendLoginLink = (phone_number_id, from, res) => {
    const loginLink = 'https://hygia-front-whats.vercel.app/auth/login';
    sendWhatsAppMessage(phone_number_id, from, `Para fazer login, acesse o seguinte link: ${loginLink}`, res);
};
