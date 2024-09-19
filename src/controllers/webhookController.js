// src/controllers/webhookController.js
const { handleRegistration } = require('../services/registrationService');
const { sendTextMessage } = require('../utils/messageSender');

// Variável para armazenar o estado de registro dos usuários
const userRegistrationState = {};

const handleWebhook = (req, res) => {
    let body = req.body;

    if (body.object) {
        const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from;

        // Verifica se a mensagem contém uma resposta interativa (botões)
        if (body.entry[0].changes[0].value.messages[0].interactive) {
            const button_reply = body.entry[0].changes[0].value.messages[0].interactive.button_reply;
            const selected_option = button_reply.id;

            if (selected_option === 'register') {
                // Iniciar o processo de registro de usuário
                userRegistrationState[from] = { step: 'start' };
                handleRegistration(phone_number_id, from, null, userRegistrationState); // Passar o estado como parâmetro
            }
        }

        // Verifica se a mensagem contém um texto
        if (body.entry[0].changes[0].value.messages[0].text) {
            const received_message = body.entry[0].changes[0].value.messages[0].text.body;

            // Verifica se o usuário já iniciou o processo de registro
            if (userRegistrationState[from]) {
                handleRegistration(phone_number_id, from, received_message, userRegistrationState); // Continuar o registro
            }
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

module.exports = { handleWebhook };
