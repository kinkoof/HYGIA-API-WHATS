const { sendInteractiveMessage } = require('../services/whatsappService');
const { VERIFY_TOKEN } = require('../config/envConfig');

exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        } else {
            return res.status(403).send('Forbidden');
        }
    }
    res.status(400).send('Bad Request');
};

exports.handleWebhook = (req, res) => {
    const body = req.body;

    if (body.object) {
        const changes = body.entry?.[0]?.changes?.[0]?.value;
        const messages = changes?.messages?.[0];

        if (messages) {
            const phoneNumberId = changes.metadata.phone_number_id;
            const from = messages.from;
            const msgBody = messages.text.body;

            sendInteractiveMessage(phoneNumberId, from);

            return res.sendStatus(200);
        }
    }
    res.sendStatus(404);
};
