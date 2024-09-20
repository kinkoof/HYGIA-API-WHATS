const { sendMessage } = require('../services/whatsappService');

// Valida o token e retorna o desafio
exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            console.log('Webhook verified');
            res.status(200).send(challenge);
        } else {
            console.log('Invalid token');
            res.status(403).send('Forbidden');
        }
    } else {
        console.log('Invalid webhook request');
        res.status(400).send('Bad Request');
    }
};

// Processa a mensagem recebida e envia a resposta
exports.handleMessage = (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0]?.changes?.[0]?.value;

        if (entry?.messages?.[0]) {
            const phone_number_id = entry.metadata.phone_number_id;
            const from = entry.messages[0].from;
            const message = entry.messages[0].text.body;

            console.log(`From: ${from}, Message: ${message}`);

            sendMessage(phone_number_id, from, res);
        } else {
            console.log('No message object found');
            res.sendStatus(404);
        }
    } else {
        console.log('Invalid body object');
        res.sendStatus(404);
    }
};
