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

const startBuyFlow = (phone_number_id, from, res) => {
    userFlows[from] = { status: 'awaiting_location' };
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, compartilhe sua localização para continuar com a compra.', res, null, true); // Solicita localização
};

const handleLocationResponse = (phone_number_id, from, location, res) => {
    console.log(`Localização recebida: Latitude ${location.latitude}, Longitude ${location.longitude}`);

    // Armazenar a localização recebida no userFlows
    userFlows[from] = {
        status: 'awaiting_product',  // Atualiza o status para aguardar o produto
        location: {
            latitude: location.latitude,
            longitude: location.longitude
        }
    };

    // Confirmação ao usuário
    sendWhatsAppMessage(phone_number_id, from, 'Obrigado pela localização. Agora, por favor, me diga o nome do produto que deseja comprar.', res);
};

const processBuyRequest = async (phone_number_id, from, productName, res) => {
    try {
        const userLocation = userFlows[from]?.location;

        if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, envie sua localização primeiro.', res);
            return;
        }

        const userLat = userLocation.latitude;
        const userLon = userLocation.longitude;

        // Busca produtos no banco de dados
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

        // Função para calcular a distância entre dois pontos
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        // Ordenar produtos por proximidade
        const sortedProducts = rows.map(product => {
            const distance = calculateDistance(userLat, userLon, product.latitude, product.longitude);
            return { ...product, distance };
        }).sort((a, b) => a.distance - b.distance);

        // Preparar a lista de produtos para envio via WhatsApp
        const listSections = [
            {
                title: 'Produtos Encontrados (ordenados pela proximidade)',
                rows: sortedProducts.map((product) => ({
                    id: `product_${product.id}`,
                    title: `${product.name} - R$${product.price.toFixed(2)}`,
                    description: `Distância: ${product.distance.toFixed(2)} km`
                }))
            }
        ];

        const listData = {
            headerText: 'Produtos Disponíveis',
            bodyText: `Aqui estão os produtos que correspondem ao termo "${productName}":`,
            buttonText: 'Ver Produtos',
            sections: listSections
        };

        // Enviar lista de produtos para o usuário
        sendWhatsAppList(phone_number_id, from, listData, res);

        // Limpa o fluxo do usuário após processar a compra
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
