const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');
const userFlows = require('../state/userFlows');

// Função para enviar mensagem de endereço
const sendAddressMessage = (phone_number_id, from, res) => {
    axios({
        method: 'POST',
        url: `https://graph.facebook.com/v15.0/${phone_number_id}/messages`,
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: from,
            type: 'interactive',
            interactive: {
                type: 'address_message',
                body: {
                    text: 'Obrigado pelo seu pedido! Diga-nos para qual endereço gostaria de enviá-lo.'
                },
                action: {
                    name: 'address_message',
                    parameters: {
                        country: 'BR' // Código ISO do país
                    }
                }
            }
        }
    })
    .then(() => res.sendStatus(200))
    .catch(error => {
        console.error('Error sending address message:', error);
        res.sendStatus(500);
    });
};

// Função para iniciar o fluxo de registro (pedindo senha)
const startRegisterFlow = (phone_number_id, from, res) => {
    userFlows[from] = { step: 'password', data: { phoneNumber: from } };
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
                userFlows[from].step = 'email';
                sendWhatsAppMessage(phone_number_id, from, 'Agora, por favor, informe seu e-mail:', res);
            } else {
                userFlows[from].step = 'password';
                sendWhatsAppMessage(phone_number_id, from, 'As senhas não coincidem. Tente novamente.', res);
            }
            break;

        case 'email':
            userFlows[from].data.email = userText;
            userFlows[from].step = 'address';
            sendAddressMessage(phone_number_id, from, res); // Envia a mensagem pedindo o endereço
            break;

        case 'address':
            userFlows[from].data.address = userText; // Armazena o endereço fornecido pelo usuário
            const { phoneNumber, password, email, address } = userFlows[from].data;
            saveUserToDatabase(from, { phoneNumber, password, email, address });
            sendWhatsAppMessage(phone_number_id, from, `Parabéns! Seu registro foi concluído com sucesso.`, res);
            delete userFlows[from];
            break;
    }
};

// Função para salvar o usuário no banco de dados
const saveUserToDatabase = (from, userData) => {
    console.log('Salvando no banco de dados:', { from, ...userData });
    // Aqui você incluiria a lógica para salvar no banco de dados
};

module.exports = { sendWhatsAppMessage, startRegisterFlow, handleRegistrationStep, saveUserToDatabase };
