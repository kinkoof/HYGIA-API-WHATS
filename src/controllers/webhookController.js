const { sendWhatsAppMessage, sendWhatsAppList, sendWhatsAppLinkButton } = require('../services/whatsappService');
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

    // Verifica se é uma resposta de localização
    if (messageObject.location) {
        handleLocationResponse(phone_number_id, from, messageObject.location, res);
        return;
    }

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

const startBuyFlow = (phone_number_id, from, res) => {
    userFlows[from] = 'awaiting_location';  // Atualiza o fluxo para aguardar a localização
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, compartilhe sua localização para continuar com a compra.', res, null, true); // Solicita localização
};

const handleLocationResponse = (phone_number_id, from, location, res) => {
    console.log(`Localização recebida: Latitude ${location.latitude}, Longitude ${location.longitude}`);
    userFlows[from] = 'buying';
    sendWhatsAppMessage(phone_number_id, from, 'Obrigado pela localização. Agora, por favor, me diga o nome do produto que deseja comprar.', res);
};

const processBuyRequest = async (phone_number_id, from, productName, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, name, price
            FROM products
            WHERE name LIKE ?`,
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

        delete userFlows[from];
    } catch (error) {
        console.error('Erro ao consultar o banco de dados:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Houve um erro ao processar seu pedido. Tente novamente mais tarde.', res);
    }
};

const sendRegisterLink = (phone_number_id, from, res) => {
    const linkData = {
        headerText: 'Registrar-se no Hygia',
        bodyText: 'Clique no botão abaixo para se registrar.',
        buttonText: 'Registrar',
        url: 'https://hygia-front-whats.vercel.app/auth/register'
    };

    sendWhatsAppLinkButton(phone_number_id, from, linkData, res);
};

const sendLoginLink = (phone_number_id, from, res) => {
    const linkData = {
        headerText: 'Fazer Login no Hygia',
        bodyText: 'Clique no botão abaixo para fazer login.',
        buttonText: 'Login',
        url: 'https://hygia-front-whats.vercel.app/auth/login'
    };

    sendWhatsAppLinkButton(phone_number_id, from, linkData, res);
};
