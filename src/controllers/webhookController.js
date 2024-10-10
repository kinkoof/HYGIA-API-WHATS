const { sendWhatsAppMessage } = require('../services/whatsappService');
const db = require('../config/db');
const userFlows = require('../state/userFlows');

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

exports.handleMessage = (req, res) => {
    const body = req.body;

    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const messageObject = entry?.messages?.[0];

    if (!messageObject) return res.sendStatus(404);

    const { phone_number_id } = entry.metadata;
    const from = messageObject.from;

    if (messageObject.interactive?.type === 'button_reply') {
        const buttonResponse = messageObject.interactive.button_reply.id;

        if (buttonResponse === 'register') {
            sendRegisterLink(phone_number_id, from, res);
        } else if (buttonResponse === 'login') {
            sendLoginLink(phone_number_id, from, res);
        } else if (buttonResponse === 'buy') {
            startBuyFlow(phone_number_id, from, res);
        } else {
            res.sendStatus(200);
        }
    } else if (messageObject.text) {
        const userText = messageObject.text.body;

        // Se o usuário estiver no fluxo de compra
        if (userFlows[from] === 'buying') {
            processBuyRequest(phone_number_id, from, userText, res);
        } else if (!userFlows[from]) {
            sendWhatsAppMessage(phone_number_id, from, 'Bem vindo ao Hygia, como podemos te ajudar hoje?', res, [
                { id: 'buy', title: 'Comprar medicamentos' },
                { id: 'login', title: 'Entrar em sua conta' },
                { id: 'register', title: 'Se registrar' },
            ]);
        } else {
            res.sendStatus(200);
        }
    } else {
        res.sendStatus(200);
    }
};

// Função para iniciar o fluxo de compra
const startBuyFlow = (phone_number_id, from, res) => {
    userFlows[from] = 'buying'; // Atualiza o fluxo para "buying"
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, me diga o nome do produto que deseja comprar.', res);
};

// Função para processar o pedido de compra
const processBuyRequest = async (phone_number_id, from, productName, res) => {
    try {
        // Consulta ao banco de dados para listar todos os produtos
        const [rows] = await db.execute('SELECT name, price FROM products');

        // Verifica se existem produtos no banco
        if (rows.length === 0) {
            sendWhatsAppMessage(phone_number_id, from, 'Desculpe, nenhum produto está disponível no momento.', res);
            return;
        }

        // Formata a lista de produtos para enviar via WhatsApp
        let productList = 'Aqui estão os produtos disponíveis:\n';
        rows.forEach((product, index) => {
            productList += `${index + 1}. ${product.name} - R$${product.price}\n`;
        });

        // Envia a lista de produtos para o usuário
        sendWhatsAppMessage(phone_number_id, from, productList, res);

        // Limpa o fluxo do usuário após enviar a lista
        delete userFlows[from];
    } catch (error) {
        console.error('Erro ao consultar o banco de dados:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Houve um erro ao processar seu pedido. Tente novamente mais tarde.', res);
    }
};

// Função para enviar o link de registro
const sendRegisterLink = (phone_number_id, from, res) => {
    const registrationLink = 'https://hygia-front-whats.vercel.app/auth/register';
    sendWhatsAppMessage(phone_number_id, from, `Para se registrar, acesse o seguinte link: ${registrationLink}`, res);
};

// Função para enviar o link de login
const sendLoginLink = (phone_number_id, from, res) => {
    const loginLink = 'https://hygia-front-whats.vercel.app/auth/login';
    sendWhatsAppMessage(phone_number_id, from, `Para fazer login, acesse o seguinte link: ${loginLink}`, res);
};
