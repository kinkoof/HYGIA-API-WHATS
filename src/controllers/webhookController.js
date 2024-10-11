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

        // Adicionar log para verificar o fluxo
        console.log(`Recebido texto do usuário: ${userText}, fluxo atual: ${userFlows[from]}`);

        if (userFlows[from] && userFlows[from].location) {
            console.log('Localização já recebida, processando o pedido...');
            processBuyRequest(phone_number_id, from, userText, res);
        } else {
            console.log('Fluxo inicial, solicitando nome do produto.');
            sendWhatsAppMessage(phone_number_id, from, 'Bem vindo ao Hygia, como podemos te ajudar hoje?', res, [
                { id: 'buy', title: 'Comprar medicamentos' },
                { id: 'login', title: 'Entrar em sua conta' },
                { id: 'register', title: 'Se registrar' },
            ]);
        }
    } else {
        res.sendStatus(200);
    }
};

// Função para iniciar o fluxo de compra e pedir localização
const startBuyFlow = (phone_number_id, from, res) => {
    userFlows[from] = 'awaiting_location';  // Atualiza o fluxo para aguardar a localização
    console.log('Solicitando localização ao usuário...');
    sendWhatsAppMessage(phone_number_id, from, 'Por favor, compartilhe sua localização para continuar com a compra.', res, null, true); // Solicita localização
};

// Função para processar a resposta de localização
const handleLocationResponse = async (phone_number_id, from, location, res) => {
    const userCoordinates = { latitude: location.latitude, longitude: location.longitude };

    console.log(`Localização recebida: Latitude ${location.latitude}, Longitude ${location.longitude}`);
    userFlows[from] = { location: userCoordinates };  // Atualiza o fluxo para incluir a localização

    sendWhatsAppMessage(phone_number_id, from, 'Obrigado pela localização. Agora, por favor, me diga o nome do produto que deseja comprar.', res);
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

        console.log(`Processando pedido para o produto: ${productName}`);

        const [rows] = await db.execute(
            `SELECT p.id, p.name, p.price, f.cep
            FROM products p
            JOIN pharmacy f ON p.pharmacy_id = f.id
            WHERE p.name LIKE ?`,
            [`%${productName}%`]
        );

        if (rows.length === 0) {
            console.log('Nenhum produto encontrado.');
            sendWhatsAppMessage(phone_number_id, from, `Nenhum produto encontrado com o nome "${productName}".`, res);
            return;
        }

        // Obter as coordenadas dos CEPs das farmácias e calcular a distância
        for (const product of rows) {
            const pharmacyCoordinates = await getCoordinatesFromCep(product.cep);
            if (pharmacyCoordinates) {
                product.distance = calculateDistance(userLocation, pharmacyCoordinates);
                console.log(`Distância calculada: ${product.distance} km para o produto ${product.name}`);
            } else {
                product.distance = Infinity; // Se não conseguir obter as coordenadas, assume distância infinita
                console.log(`Não foi possível calcular a distância para o produto ${product.name}`);
            }
        }

        // Ordenar os produtos pela distância
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

        console.log('Enviando a lista de produtos...');
        sendWhatsAppList(phone_number_id, from, listData, res);

        delete userFlows[from];
    } catch (error) {
        console.error('Erro ao consultar o banco de dados:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Houve um erro ao processar seu pedido. Tente novamente mais tarde.', res);
    }
};

// Função para enviar o link de registro com botão interativo
const sendRegisterLink = (phone_number_id, from, res) => {
    const linkData = {
        headerText: 'Registre-se',
        bodyText: 'Para se registrar, clique no link abaixo:',
        buttonText: 'Registrar',
        url: 'https://hygia-front-whats.vercel.app/auth/register'
    };
    sendWhatsAppLinkButton(phone_number_id, from, linkData, res);
};

// Função para enviar o link de login com botão interativo
const sendLoginLink = (phone_number_id, from, res) => {
    const linkData = {
        headerText: 'Login',
        bodyText: 'Para fazer login, clique no link abaixo:',
        buttonText: 'Entrar',
        url: 'https://hygia-front-whats.vercel.app/auth/login'
    };
    sendWhatsAppLinkButton(phone_number_id, from, linkData, res);
};
