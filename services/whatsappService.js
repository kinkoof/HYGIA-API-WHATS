const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');
const userFlows = require('../state/userFlows');

// Função reutilizável para enviar mensagens
const sendWhatsAppMessage = (phone_number_id, to, text, res, buttons = null) => {
    const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: buttons ? 'interactive' : 'text',
        ...(buttons ? {
            interactive: {
                type: 'button',
                header: { type: 'text', text: 'Bem Vindo' },
                body: { text },
                action: { buttons: buttons.map(button => ({ type: 'reply', reply: button })) }
            }
        } : {
            text: { body: text }
        })
    };

    axios.post(`https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`, messageData)
        .then(() => res.sendStatus(200))
        .catch(error => {
            console.error('Error sending message:', error);
            res.sendStatus(500);
        });
};

// Inicia o fluxo de registro
const startRegisterFlow = (phone_number_id, from, res) => {
    userFlows[from] = { step: 'password', data: {} };
    sendWhatsAppMessage(phone_number_id, from, 'Para começar seu registro, defina uma Senha:', res);
};

// Gerencia o fluxo de registro
const handleRegistrationStep = (phone_number_id, from, userText, res) => {
    const currentStep = userFlows[from]?.step;

    if (!currentStep) return sendWhatsAppMessage(phone_number_id, from, 'Não entendi, por favor, tente novamente.', res);

    switch (currentStep) {
        case 'password':
            userFlows[from].data.password = userText;
            userFlows[from].step = 'confirmPassword';
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, confirme sua senha:', res);
            break;

        case 'confirmPassword':
            if (userText === userFlows[from].data.password) {
                saveUserToDatabase(from, { password: userFlows[from].data.password });
                sendWhatsAppMessage(phone_number_id, from, `Parabéns! Seu registro foi concluído com sucesso.`, res);
                delete userFlows[from];
            } else {
                userFlows[from].step = 'password';
                sendWhatsAppMessage(phone_number_id, from, 'As senhas não coincidem. Tente novamente.', res);
            }
            break;
    }
};

const saveUserToDatabase = (from, userData) => {
    console.log('Salvando no banco de dados:', userData);
};

module.exports = { sendWhatsAppMessage, startRegisterFlow, handleRegistrationStep, saveUserToDatabase };
