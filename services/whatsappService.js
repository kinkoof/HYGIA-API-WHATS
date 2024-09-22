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
// Inicia o fluxo de registro
exports.startRegisterFlow = (phone_number_id, from, res) => {
    userFlows[from] = { step: 'password', data: {} };

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
                body: 'Para começar seu registro, defina uma Senha:',
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
        case 'password':
            // Armazena a senha e avança para a confirmação
            userFlows[from].data.password = userText;
            userFlows[from].step = 'confirmPassword';
            askNextStep(phone_number_id, from, res); // Solicita confirmação da senha
            break;
        case 'confirmPassword':
            // Verifica se a confirmação da senha corresponde
            if (userText === userFlows[from].data.password) {
                // Senha confirmada
                saveUserToDatabase(from, { password: userFlows[from].data.password });
                res.send({ status: 200, body: 'Registro completo!' });
                delete userFlows[from]; // Limpa o fluxo após registro
            } else {
                res.send({ status: 400, body: 'As senhas não coincidem. Por favor, tente novamente.' });
            }
            break;
            // Lógica para verificar a senha
            const { password } = userFlows[from].data;
            const userText = req.body.entry[0].changes[0].value.messages[0].text.body;

            if (userText === password) {
                // Senha confirmada
                saveUserToDatabase(from, { password }); // Salva apenas a senha
                message = 'Registro completo!';
                userFlows[from] = {}; // Limpa o fluxo
            } else {
                message = 'As senhas não coincidem. Tente novamente.';
                userFlows[from].step = 'password'; // Retorna para a senha
            }
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
