const { sendWhatsAppMessage, sendWhatsAppList, sendWhatsAppLinkButton } = require('../services/whatsappService');
const db = require('../config/db');
const axios = require('axios');
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

// Função para iniciar o fluxo de compra e pedir localização
const startBuyFlow = (phone_number_id, from, res) => {
    userFlows[from] = 'awaiting_location';  // Atualiza o fluxo para aguardar a localização
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, compartilhe sua localização para continuar com a compra.', res, null, true); // Solicita localização
};

// Função para processar a resposta de localização
const handleLocationResponse = async (phone_number_id, from, location, res) => {
    const userCoordinates = { latitude: location.latitude, longitude: location.longitude };

    console.log(`Localização recebida: Latitude ${location.latitude}, Longitude ${location.longitude}`);
    userFlows[from] = 'buying';  // Atualiza o fluxo para "buying" após receber a localização

    // Solicita ao usuário o nome do produto
    sendWhatsAppMessage(phone_number_id, from, 'Obrigado pela localização. Agora, por favor, me diga o nome do produto que deseja comprar.', res);

    // Armazena as coordenadas do usuário no fluxo
    userFlows[from] = { location: userCoordinates };
};

// Função para converter CEP em coordenadas de latitude e longitude usando a API do ViaCEP
const getCoordinatesFromCep = async (cep) => {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    try {
        const response = await axios.get(url);
        if (response.data && !response.data.erro) {
            const { logradouro, localidade, uf } = response.data;
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${logradouro},+${localidade},+${uf},+Brasil&format=json&limit=1`;
            const geocodeResponse = await axios.get(geocodeUrl);
            if (geocodeResponse.data.length > 0) {
                const { lat, lon } = geocodeResponse.data[0];
                return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
            }
        }
    } catch (error) {
        console.error('Erro ao converter CEP em coordenadas:', error);
    }
    return null;
};

// Função para calcular a distância entre duas coordenadas (fórmula de Haversine)
const calculateDistance = (coord1, coord2) => {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const R = 6371; // Raio da Terra em km

    const dLat = toRadians(coord2.latitude - coord1.latitude);
    const dLon = toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em km
};

// Função para processar o pedido de compra e ordenar os produtos pela distância
const processBuyRequest = async (phone_number_id, from, productName, res) => {
    try {
        const userLocation = userFlows[from].location;  // Obtém a localização do usuário

        const [rows] = await db.execute(
            `SELECT p.id, p.name, p.price, f.cep
            FROM products p
            JOIN pharmacy f ON p.pharmacy_id = f.id
            WHERE p.name LIKE ?`,
            [`%${productName}%`]
        );

        if (rows.length === 0) {
            sendWhatsAppMessage(phone_number_id, from, `Nenhum produto encontrado com o nome "${productName}".`, res);
            return;
        }

        for (const product of rows) {
            const pharmacyCoordinates = await getCoordinatesFromCep(product.cep);
            if (pharmacyCoordinates) {
                product.distance = calculateDistance(userLocation, pharmacyCoordinates);
            } else {
                product.distance = Infinity;
            }
        }

        rows.sort((a, b) => a.distance - b.distance);

        const listSections = [
            {
                title: 'Produtos Encontrados (do mais próximo ao mais distante)',
                rows: rows.map((product) => ({
                    id: `product_${product.id}`,
                    title: product.name,
                    description: `R$${product.price.toFixed(2)} - Distância: ${product.distance.toFixed(2)} km`
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
