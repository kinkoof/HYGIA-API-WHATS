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
    } else if (messageObject.location) {
        const userLat = messageObject.location.latitude;
        const userLon = messageObject.location.longitude;

        userFlows[from] = { status: 'awaiting_product', lat: userLat, lon: userLon };

        sendWhatsAppMessage(phone_number_id, from, 'Obrigado! Agora, por favor, informe o nome do produto que deseja comprar.', res);
    } else if (messageObject.text) {
        const userText = messageObject.text.body;

        if (userFlows[from]?.status === 'awaiting_product') {
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

// Iniciar fluxo de compra e solicitar localização
const startBuyFlow = (phone_number_id, from, res) => {
    userFlows[from] = 'awaiting_location';
    askForLocation(phone_number_id, from, res);
};

// Solicitar a localização do usuário utilizando location_request_message
const askForLocation = (phone_number_id, from, res) => {
    const messageText = 'Por favor, compartilhe sua localização para que possamos encontrar farmácias próximas a você.';

    // Chamada para enviar mensagem solicitando a localização
    sendWhatsAppMessage(phone_number_id, from, messageText, res, null, true);
};


// Processar a solicitação de compra
const processBuyRequest = async (phone_number_id, from, productName, res) => {
    try {
        const userLocation = userFlows[from];
        const { lat: userLat, lon: userLon } = userLocation;

        const [rows] = await db.execute(
            `SELECT p.id, p.name, p.price, f.latitude, f.longitude
            FROM products p
            JOIN pharmacy f ON p.pharmacy_id = f.id
            WHERE p.name LIKE ?`,
            [`%${productName}%`]
        );

        if (rows.length === 0) {
            sendWhatsAppMessage(phone_number_id, from, `Nenhum produto encontrado com o nome "${productName}".`, res);
            return;
        }

        // Função para calcular a distância usando a fórmula de Haversine
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Raio da Terra em km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLon / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distância em km
        };

        // Adiciona a distância calculada ao produto e ordena os resultados
        const productsWithDistance = rows.map((product) => {
            const distance = calculateDistance(userLat, userLon, product.latitude, product.longitude);
            return { ...product, distance };
        }).sort((a, b) => a.distance - b.distance);

        const listSections = [
            {
                title: 'Produtos Encontrados',
                rows: productsWithDistance.map((product) => ({
                    id: `product_${product.id}`,
                    title: `${product.name} - ${product.distance.toFixed(2)} km`,
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
