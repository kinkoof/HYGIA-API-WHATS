// controllers/webhookController.js
const axios = require('../utils/axiosInstance');
const { VERIFY_TOKEN, ACCESS_TOKEN } = require('../config/config');

// Armazenamento temporário (em produção, use um banco de dados)
const registrationState = {};

exports.verifyWebhook = (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Forbidden');
        }
    } else {
        res.status(400).send('Bad Request');
    }
};

exports.handleMessage = async (req, res) => {
    let body = req.body;
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let message = body.entry[0].changes[0].value.messages[0];
            let text = message.text ? message.text.body : '';

            if (message.interactive && message.interactive.button_reply) {
                let button_id = message.interactive.button_reply.id;

                if (button_id === 'register') {
                    registrationState[from] = { step: 1 };
                    await sendRegistrationPrompt(phone_number_id, from, 'email');
                }
            } else if (registrationState[from]) {
                let userData = registrationState[from];

                if (userData.step === 1) {
                    userData.email = text;
                    userData.step = 2;
                    await sendRegistrationPrompt(phone_number_id, from, 'cnpj');
                } else if (userData.step === 2) {
                    userData.cnpj = text;
                    userData.step = 3;
                    await sendRegistrationPrompt(phone_number_id, from, 'senha');
                } else if (userData.step === 3) {
                    userData.password = text;
                    delete registrationState[from];
                    await sendConfirmationMessage(phone_number_id, from);
                }
            } else {
                console.log('Received a non-interactive message or unknown case');
            }

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    }
};

const sendRegistrationPrompt = async (phone_number_id, recipient_id, field) => {
    let message;
    switch (field) {
        case 'email':
            message = 'Por favor, envie seu email.';
            break;
        case 'cnpj':
            message = 'Por favor, envie seu CNPJ.';
            break;
        case 'senha':
            message = 'Por favor, envie uma senha.';
            break;
        default:
            message = 'Estamos com um problema, por favor tente novamente.';
    }

    try {
        await axios.post(`/v19.0/${phone_number_id}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient_id,
            type: 'text',
            text: {
                body: message,
            },
        });
        console.log(`Prompt for ${field} sent successfully`);
    } catch (error) {
        console.error('Error sending prompt message:', error.response ? error.response.data : error.message);
    }
};

const sendConfirmationMessage = async (phone_number_id, recipient_id) => {
    try {
        await axios.post(`/v19.0/${phone_number_id}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient_id,
            type: 'text',
            text: {
                body: 'Seu registro foi completado com sucesso!',
            },
        });
        console.log('Registration confirmation message sent successfully');
    } catch (error) {
        console.error('Error sending confirmation message:', error.response ? error.response.data : error.message);
    }
};
