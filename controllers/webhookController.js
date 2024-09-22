const { sendMessage, startRegisterFlow, askNextStep, saveUserToDatabase } = require('../services/whatsappService');

const userFlows = {};

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

            // Caso o usuário interaja com botões
            if (messageObject.interactive && messageObject.interactive.type === 'button_reply') {
                const buttonResponse = messageObject.interactive.button_reply.id;

                if (buttonResponse === 'register') {
                    startRegisterFlow(phone_number_id, from, res);
                } else {
                    res.sendStatus(200);
                }
            }
            else if (messageObject.text && !userFlows[from]) {
                // Envia mensagem de boas-vindas com os botões interativos
                sendMessage(phone_number_id, from, res);
            }
            // Caso o usuário já esteja no fluxo de registro
            else if (messageObject.text && userFlows[from]) {
                const currentStep = userFlows[from].step;
                const userText = messageObject.text.body;

                switch (currentStep) {
                    case 'name':
                        // Armazena o nome e avança para o email
                        userFlows[from].data.name = userText;
                        userFlows[from].step = 'email';
                        askNextStep(phone_number_id, from, res);
                        break;

                    case 'email':
                        // Armazena o email e avança para a confirmação
                        userFlows[from].data.email = userText;
                        askNextStep(phone_number_id, from, res);
                        break;

                    case 'final':
                        // Confirmar os dados e salvar
                        if (userText.toLowerCase() === 'sim') {
                            saveUserToDatabase(from, userFlows[from].data);
                            res.sendStatus(200);
                        } else {
                            res.sendStatus(400);
                        }
                        break;

                    default:
                        res.sendStatus(200);
                        break;
                }
            } else {
                res.sendStatus(200);
            }
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
};


