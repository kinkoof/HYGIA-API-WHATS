const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');
const userFlows = require('../state/userFlows');

// Função reutilizável para enviar mensagens
const sendWhatsAppMessage = (phone_number_id, to, text, res, buttons = null, location = null) => {
    let messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
    };

    if (buttons) {
        messageData = {
            ...messageData,
            type: 'interactive',
            interactive: {
                type: 'button',
                header: { type: 'text', text: 'Bem Vindo' },
                body: { text },
                action: { buttons: buttons.map(button => ({ type: 'reply', reply: button })) }
            }
        };
    } else if (location) {
        messageData = {
            ...messageData,
            type: 'location',
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                name: location.name,
                address: location.address
            }
        };
    } else {
        messageData = {
            ...messageData,
            type: 'text',
            text: { body: text }
        };
    }

    axios.post(`https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`, messageData)
        .then(() => res.sendStatus(200))
        .catch(error => {
            console.error('Error sending message:', error);
            res.sendStatus(500);
        });
};

// Inicia o fluxo de registro
const startRegisterFlow = (phone_number_id, from, res) => {
    userFlows[from] = { step: 'password', data: { phoneNumber: from } }; // Armazena o número do usuário
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
                userFlows[from].step = 'email'; // Avança para o passo do e-mail
                sendWhatsAppMessage(phone_number_id, from, 'Agora, por favor, informe seu e-mail:', res);
            } else {
                userFlows[from].step = 'password';
                sendWhatsAppMessage(phone_number_id, from, 'As senhas não coincidem. Vamos começar de novo. Por favor defina a', res);
            }
            break;

        case 'email':
            userFlows[from].data.email = userText; // Armazena o e-mail do usuário
            userFlows[from].step = 'location'; // Avança para o passo de localização
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, compartilhe sua localização:', res);
            break;

        case 'location':
            // Aqui você pode salvar a localização enviada (neste exemplo, estamos simulando a localização)
            const location = {
                latitude: '-23.550520', // Exemplo de latitude (São Paulo)
                longitude: '-46.633308', // Exemplo de longitude
                name: 'São Paulo',
                address: 'São Paulo, SP, Brasil'
            };
            userFlows[from].data.location = location; // Salva a localização do usuário
            const { phoneNumber, password, email } = userFlows[from].data; // Pega os dados
            saveUserToDatabase(from, { phoneNumber, password, email, location });
            sendWhatsAppMessage(phone_number_id, from, `Parabéns! Seu registro foi concluído com sucesso.`, res);
            delete userFlows[from];
            break;
    }
};

// Função para salvar o usuário no banco de dados
const saveUserToDatabase = (from, userData) => {
    console.log('Salvando no banco de dados:', { from, ...userData });
    // Aqui você incluiria a lógica para salvar no banco, como uma inserção no MongoDB, MySQL, etc.
};

module.exports = { sendWhatsAppMessage, startRegisterFlow, handleRegistrationStep, saveUserToDatabase };
