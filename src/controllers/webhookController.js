const { handleRegistration } = require('../services/registrationService');

const handleWebhook = (req, res) => {
    let body = req.body;

    if (body.object) {
        const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from;

        if (body.entry[0].changes[0].value.messages[0].interactive) {
            const button_reply = body.entry[0].changes[0].value.messages[0].interactive.button_reply;
            const selected_option = button_reply.id;

            if (selected_option === 'register') {
                handleRegistration(phone_number_id, from, null); // Iniciar o registro
            }
        }

        if (body.entry[0].changes[0].value.messages[0].text) {
            const received_message = body.entry[0].changes[0].value.messages[0].text.body;

            if (userRegistrationState[from]) {
                handleRegistration(phone_number_id, from, received_message); // Continuar o registro
            }
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

module.exports = { handleWebhook };
