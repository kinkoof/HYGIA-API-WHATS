const { sendWhatsAppMessage, sendWhatsAppList, sendWhatsAppLocation } = require('../services/whatsappService');
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

    if (messageObject.interactive?.type === 'button_reply') {
        const buttonResponse = messageObject.interactive.button_reply.id;
        handleButtonResponse(phone_number_id, from, buttonResponse, res);
    } else if (messageObject.interactive?.type === 'list_reply') {
        const selectedProductId = messageObject.interactive.list_reply.id;
        handleListResponse(phone_number_id, from, selectedProductId, res);
    } else if (messageObject.text) {
        const userText = messageObject.text.body.toLowerCase();
        handleTextResponse(phone_number_id, from, userText, res);
    }
};

// Tratamento das respostas de botão
const handleButtonResponse = (phone_number_id, from, buttonResponse, res) => {
    switch (buttonResponse) {
        case 'buy':
            startCategorySelection(phone_number_id, from, res);
            break;
        case 'location':
            sendStoreLocation(phone_number_id, from, res);
            break;
        case 'contact':
            sendWhatsAppMessage(phone_number_id, from, 'Nossa equipe está disponível para ajudar. Entre em contato conosco a qualquer momento!', res);
            break;
        case 'confirm_purchase':
            confirmPurchase(phone_number_id, from, res);
            break;
        case 'checkout':
            showCart(phone_number_id, from, res);
            break;
        default:
            res.sendStatus(200);
    }
};

// Início da seleção de categorias com lista
const startCategorySelection = (phone_number_id, from, res) => {
    const categories = [
        { id: 'category_medicine', title: 'Medicamentos' },
        { id: 'category_hygiene', title: 'Higiene' },
        { id: 'category_personal_care', title: 'Cuidados Pessoais' }
    ];

    const listData = {
        headerText: 'Categorias de Produtos',
        bodyText: 'Escolha uma categoria para ver nossos produtos:',
        buttonText: 'Ver Categorias',
        sections: [{ title: 'Categorias', rows: categories }]
    };

    sendWhatsAppList(phone_number_id, from, listData, res);
};

// Envio da localização da loja
const sendStoreLocation = (phone_number_id, from, res) => {
    const storeLocation = {
        latitude: -23.5505,
        longitude: -46.6333,
        name: 'Loja Hygia - São Paulo',
        address: 'Av. Paulista, São Paulo - SP, Brasil'
    };
    sendWhatsAppLocation(phone_number_id, from, storeLocation, res);
};

// Respostas de texto do usuário
const handleTextResponse = (phone_number_id, from, userText, res) => {
    if (!userFlows[from]) {
        sendWelcomeMessage(phone_number_id, from, res);
    } else if (userFlows[from].status === 'cart') {
        if (userText === 'continuar') {
            startCategorySelection(phone_number_id, from, res);
        } else if (userText === 'finalizar') {
            showCart(phone_number_id, from, res);
        } else {
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, responda com "continuar" ou "finalizar".', res);
        }
    } else if (userFlows[from].status === 'awaiting_product') {
        processBuyRequest(phone_number_id, from, userText, res);
    }
};

// Mensagem de boas-vindas com botões iniciais
const sendWelcomeMessage = (phone_number_id, from, res) => {
    userFlows[from] = { status: 'initial' };

    sendWhatsAppMessage(phone_number_id, from, 'Bem-vindo ao Hygia! Como podemos ajudar?', res, [
        { id: 'buy', title: 'Ver Produtos' },
        { id: 'location', title: 'Localizar Loja' },
        { id: 'contact', title: 'Fale Conosco' }
    ]);
};

// Adicionando produto ao carrinho e verificando finalização
const addToCart = async (phone_number_id, from, selectedProductId, res) => {
    console.log(`Usuário ${from} tentou adicionar o produto ${selectedProductId} ao carrinho.`);
    const productId = selectedProductId.replace('product_', '');

    try {
        const [rows] = await db.execute(
            `SELECT id, name, price FROM products WHERE id = ?`,
            [productId]
        );

        if (rows.length === 0) {
            sendWhatsAppMessage(phone_number_id, from, 'Produto não encontrado.', res);
            return;
        }

        const product = rows[0];
        if (!userFlows[from].cart) userFlows[from].cart = [];
        userFlows[from].cart.push(product);
        userFlows[from].status = 'cart';

        sendWhatsAppMessage(phone_number_id, from, 'Deseja continuar comprando ou finalizar a compra?', res, [
            { id: 'buy', title: 'Continuar Comprando' },
            { id: 'checkout', title: 'Finalizar Compra' }
        ]);
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        sendWhatsAppMessage(phone_number_id, from, 'Erro ao adicionar o produto ao carrinho.', res);
    }
};

// Processando solicitação de compra com listagem de produtos
const processBuyRequest = async (phone_number_id, from, productName, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, name, price FROM products WHERE name LIKE ?`,
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
        sendWhatsAppMessage(phone_number_id, from, 'Erro ao processar seu pedido.', res);
    }
};

// Mostrar carrinho e confirmar compra
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

// Confirmar compra e limpar o carrinho
const confirmPurchase = (phone_number_id, from, res) => {
    const cart = userFlows[from]?.cart;
    if (!cart || cart.length === 0) {
        sendWhatsAppMessage(phone_number_id, from, 'Seu carrinho está vazio.', res);
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
    sendWhatsAppMessage(phone_number_id, from, `Compra confirmada! O valor total é R$${total}. Obrigado por comprar conosco!`, res);

    userFlows[from] = { status: 'initial' }; // Resetar o fluxo do usuário
};
