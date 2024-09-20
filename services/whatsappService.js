const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');

// Envia uma mensagem de resposta interativa
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
