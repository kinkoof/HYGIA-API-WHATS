const { sendWhatsAppMessage, startRegisterFlow, handleRegistrationStep, saveUserToDatabase } = require('../state/userFlows');
const userFlows = require('../state/userFlows');
// teste
// Valida o token e retorna o desafio
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

exports.handleMessage = (req, res) => {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return res.sendStatus(404);

    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const messageObject = entry?.messages?.[0];

    if (!messageObject) return res.sendStatus(404);

    const { phone_number_id } = entry.metadata;
    const from = messageObject.from;

    if (messageObject.interactive?.type === 'button_reply') {
        const buttonResponse = messageObject.interactive.button_reply.id;

        if (buttonResponse === 'register') {
            startRegisterFlow(phone_number_id, from, res);
        } else {
            res.sendStatus(200);
        }
    } else if (messageObject.text) {
        const userText = messageObject.text.body;

        if (!userFlows[from]) {
            sendWhatsAppMessage(phone_number_id, from, 'Bem vindo ao Hygia, como podemos te ajudar hoje?', res, [
                { id: 'buy', title: 'Comprar medicamentos' },
                { id: 'login', title: 'Entrar em sua conta' },
                { id: 'register', title: 'Se registrar' },
            ]);
        } else {
            handleRegistrationStep(phone_number_id, from, userText, res);
        }
    } else if (messageObject.type === 'location') {
        const locationData = messageObject.location;
        const location = {
            address: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            name: locationData.name
        };

        if (userFlows[from]) {
            userFlows[from].data.location = location; // Salva a localização no fluxo do usuário
            const { phoneNumber, password, email } = userFlows[from].data;
            saveUserToDatabase(from, { phoneNumber, password, email, location }); // Salva no banco de dados
            sendWhatsAppMessage(phone_number_id, from, 'Obrigado por compartilhar sua localização! Seu registro foi concluído com sucesso.', res);
            delete userFlows[from];
        } else {
            sendWhatsAppMessage(phone_number_id, from, 'Localização recebida, mas não estou em um fluxo de registro.', res);
        }
    } else {
        res.sendStatus(200);
    }
};
