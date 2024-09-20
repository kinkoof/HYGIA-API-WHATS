const { sendMessage, sendRegisterFlow } = require('../services/whatsappService');

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

exports.handleMessage = (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0]?.changes?.[0]?.value;

        if (entry?.messages?.[0]) {
            const messageObject = entry.messages[0];
            const phone_number_id = entry.metadata.phone_number_id;
            const from = messageObject.from;

            // Verifica se a mensagem é uma resposta a um botão interativo
            if (messageObject.button) {
                const buttonResponse = messageObject.button.reply.id;

                switch (buttonResponse) {
                    case 'register':
                        // Inicia o fluxo de registro
                        sendRegisterFlow(phone_number_id, from, res);
                        break;

                    default:
                        res.sendStatus(200);
                        break;
                }
            } else if (messageObject.text && ongoingFlow[from]) {
                // Verifica se o fluxo de registro está em andamento
                const currentStep = ongoingFlow[from].step;

                switch (currentStep) {
                    case 'name':
                        // Salva o nome do usuário e passa para o próximo passo (ex: email)
                        saveName(from, messageObject.text.body);
                        sendNextStep(phone_number_id, from, 'email', res);
                        break;

                    // Outros casos para capturar email, telefone, etc.
                    default:
                        res.sendStatus(200);
                        break;
                }
            } else {
                res.sendStatus(200);
            }
        } else {
            console.log('No message object found');
            res.sendStatus(404);
        }
    } else {
        console.log('Invalid body object');
        res.sendStatus(404);
    }
};

