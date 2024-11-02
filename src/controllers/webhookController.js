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

        if (buttonResponse === 'register') {
            sendRegisterLink(phone_number_id, from, res);
        } else if (buttonResponse === 'login') {
            sendLoginLink(phone_number_id, from, res);
        } else if (buttonResponse === 'buy') {
            startBuyFlow(phone_number_id, from, res);
        } else if (buttonResponse === 'checkout') {
            showCart(phone_number_id, from, res);
        } else if (buttonResponse === 'confirm_purchase') {
            confirmPurchase(phone_number_id, from, res);
        } else {
            res.sendStatus(200);
        }
    }
    // Verificação se é uma resposta de lista
    else if (messageObject.interactive?.type === 'list_reply') {
        const selectedProductId = messageObject.interactive.list_reply.id;
        console.log(`Produto selecionado pelo usuário ${from}: ${selectedProductId}`);

        // Atualizar o status do usuário para 'cart'
        userFlows[from].status = 'cart';

        if (userFlows[from]?.status === 'cart') {
            addToCart(phone_number_id, from, selectedProductId, res);
        } else {
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, selecione um produto da lista após iniciar uma compra.', res);
        }
    }
    else if (messageObject.text) {
        const userText = messageObject.text.body.toLowerCase(); // Converte para minúsculas para facilitar a verificação
        console.log(`Texto recebido do usuário ${from}: ${userText}`);

        if (userFlows[from]?.status === 'awaiting_product') {
            processBuyRequest(phone_number_id, from, userText, res);
        } else if (userFlows[from]?.status === 'cart') {
            // Verificar resposta do usuário sobre continuar ou finalizar
            if (userText === 'continuar') {
                startBuyFlow(phone_number_id, from, res);
            } else if (userText === 'finalizar') {
                showCart(phone_number_id, from, res); // Mostra o carrinho para confirmação final
            } else {
                sendWhatsAppMessage(phone_number_id, from, 'Resposta inválida. Por favor, responda com "continuar" ou "finalizar".', res);
            }
        } else if (!userFlows[from]) {
            const id1 = 'buy'
            const id2 = 'login'
            const id3 = 'register'
            const welcomeText1 = 'Comprar medicamentos'
            const welcomeText2 = 'Entrar em sua conta'
            const welcomeText3 = 'Se registrar'
            sendWhatsAppMessage(phone_number_id, from, 'Bem vindo ao Hygia, como podemos te ajudar hoje?', res, [
                { id: `${id1}`, title: `${welcomeText1}` },
                { id: `${id2}`, title: `${welcomeText2}` },
                { id: `${id3}`, title: `${welcomeText3}` },
            ]);
        } else {
            res.sendStatus(200);
        }
    }


};

const addToCart = async (phone_number_id, from, selectedProductId, res) => {
    console.log(`Usuário ${from} tentou adicionar o produto ${selectedProductId} ao carrinho.`);
    const productId = selectedProductId.replace('product_', '');

    try {
        const [rows] = await db.execute(
            `SELECT id, name, price FROM products WHERE id = ?`,
            [productId]
        );

        console.log('Resposta do banco de dados:', rows); l

        if (rows.length === 0) {
            console.log(`Produto não encontrado para o ID: ${productId}`);
            sendWhatsAppMessage(phone_number_id, from, 'Produto não encontrado.', res);
            return;
        }

        const product = rows[0];
        if (!userFlows[from].cart) userFlows[from].cart = [];
        userFlows[from].cart.push(product);

        userFlows[from].status = 'cart';
        console.log(`Produto ${product.name} adicionado ao carrinho do usuário ${from}.`);

        // Pergunta direta ao usuário se deseja continuar ou finalizar a compra
        sendWhatsAppMessage(phone_number_id, from, 'Deseja continuar comprando ou finalizar a compra? Responda com "continuar" ou "finalizar".', res);
        const id1 = 'continuar'
        const id2 = 'finalizar'
        const id3 = ''
        const welcomeText1 = 'continuar'
        const welcomeText2 = 'finalizar'
        const welcomeText3 = ''
        sendWhatsAppMessage(phone_number_id, from, 'Bem vindo ao Hygia, como podemos te ajudar hoje?', res, [
            { id: `${id1}`, title: `${welcomeText1}` },
            { id: `${id2}`, title: `${welcomeText2}` },
            { id: `${id3}`, title: `${welcomeText3}` },
        ]);
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Erro ao adicionar o produto ao carrinho. Tente novamente.', res);
    }
};

// Iniciar fluxo de compra
const startBuyFlow = (phone_number_id, from, res) => {
    userFlows[from] = { status: 'awaiting_product', cart: [] }; // Inicializa o carrinho vazio
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, informe o nome do produto que deseja comprar.', res);
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

    sendWhatsAppMessage(phone_number_id, from, `Itens no seu carrinho:\n${cartSummary}\n\nTotal: R$${total}`, res, [
        { id: 'confirm_purchase', title: 'Confirmar Compra' },
        { id: 'buy', title: 'Adicionar mais produtos' }
    ]);
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
            WHERE p.name LIKE ?`,
            [`%${productName}%`]
        );

        if (rows.length === 0) {
            sendWhatsAppMessage(phone_number_id, from, `Nenhum produto encontrado com o nome "${productName}".`, res);
            return;
        }

        const listSections = [
            {
                title: 'Produtos Encontrados',
                rows: rows.map((product) => ({
                    id: `product_${product.id}`,
                    title: product.name,
                    description: `R$${product.price.toFixed(2)}`
                }))
            }
        ];

        const listData = {
            headerText: 'Produtos Disponíveis',
            bodyText: `Aqui estão os produtos que correspondem ao termo "${productName}":`,
            buttonText: 'Ver Produtos',
            sections: listSections
        };

        sendWhatsAppList(phone_number_id, from, listData, res);
    } catch (error) {
        console.error('Erro ao consultar o banco de dados:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Houve um erro ao processar seu pedido. Tente novamente mais tarde.', res);
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
