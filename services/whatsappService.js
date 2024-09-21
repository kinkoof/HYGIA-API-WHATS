const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');

const userFlows = {};

// Envia a mensagem de boas-vindas com botões interativos
exports.sendMessage = (phone_number_id, from, res) => {
    axios({
        method: 'POST',
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: from,
            type: 'interactive',
            interactive: {
                type: 'button',
                header: {
                    type: 'text',
                    text: 'Bem Vindo',
                },
                body: {
                    text: 'Bem vindo ao Hygia, como podemos te ajudar hoje?',
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'buy',
                                title: 'Comprar medicamentos',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'login',
                                title: 'Entrar em sua conta',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'register',
                                title: 'Se registrar',
                            },
                        },
                    ],
                },
            },
        },
    })
    .then(() => {
        res.sendStatus(200);
    })
    .catch((error) => {
        console.error('Error sending message:', error);
        res.sendStatus(500);
    });
};

// Inicia o fluxo de registro
exports.startRegisterFlow = (phone_number_id, from, res) => {
    userFlows[from] = { step: 'name', data: {} };

    axios({
        method: 'POST',
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: from,
            type: 'text',
            text: {
                body: 'Para começar seu registro, por favor, informe seu nome completo:',
            },
        },
    })
    .then(() => {
        res.sendStatus(200);
    })
    .catch((error) => {
        console.error('Error sending message:', error);
        res.sendStatus(500);
    });
};

exports.askNextStep = (phone_number_id, from, res) => {
    const currentStep = userFlows[from]?.step;
    let message = '';

    switch (currentStep) {
        case 'email':
            message = 'Agora, por favor, informe seu email:';
            userFlows[from].step = 'confirmation'; // Após email, passa para a confirmação
            break;
        case 'confirmation':
            message = `Seu nome: ${userFlows[from].data.name}\nSeu email: ${userFlows[from].data.email}\nTudo certo? (Responda com 'sim' para confirmar)`;
            userFlows[from].step = 'final'; // Avança para a confirmação final
            break;
        default:
            message = 'Não entendi, por favor, tente novamente.';
    }

    axios({
        method: 'POST',
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: from,
            type: 'text',
            text: {
                body: message,
            },
        },
    })
    .then(() => {
        res.sendStatus(200);
    })
    .catch((error) => {
        console.error('Error sending message:', error);
        res.sendStatus(500);
    });
};

exports.saveUserToDatabase = (from, userData) => {
    console.log('Salvando no banco de dados:', userData);
};
