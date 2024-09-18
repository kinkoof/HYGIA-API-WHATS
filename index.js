const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
require('dotenv').config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(bodyParser.json());

app.listen(process.env.PORT, () => {
    console.log('Server is running');
});

app.get('/webhook', (req, res) => {
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
});

const sendButtonsMessage = (phone_number_id, from) => {
    axios({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
        data: {
            messaging_product: "whatsapp",
            to: from,
            type: "interactive",
            interactive: {
                type: "button",
                header: {
                    type: "text",
                    text: "Escolha uma opção"
                },
                body: {
                    text: "Selecione uma das opções abaixo:"
                },
                action: {
                    buttons: [
                        {
                            type: "reply",
                            reply: {
                                id: "option_1",
                                title: "Opção 1"
                            }
                        },
                        {
                            type: "reply",
                            reply: {
                                id: "option_2",
                                title: "Opção 2"
                            }
                        },
                        {
                            type: "reply",
                            reply: {
                                id: "option_3",
                                title: "Opção 3"
                            }
                        }
                    ]
                }
            }
        },
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        console.log('Botões enviados com sucesso:', response.data);
    }).catch(error => {
        console.error('Erro ao enviar botões:', error.response ? error.response.data : error.message);
    });
};

// Send text message
const sendTextMessage = (phone_number_id, from, message) => {
    axios({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
        data: {
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: {
                body: message
            }
        },
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        console.log('Mensagem enviada com sucesso:', response.data);
    }).catch(error => {
        console.error('Erro ao enviar mensagem:', error.response ? error.response.data : error.message);
    });
};

app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object) {
        const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from;

        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0].text
        ) {
            const received_message = body.entry[0].changes[0].value.messages[0].text.body;
            console.log('Mensagem recebida: ', received_message);

            sendButtonsMessage(phone_number_id, from);
        }

        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0].interactive
        ) {
            const button_reply = body.entry[0].changes[0].value.messages[0].interactive.button_reply;
            const selected_option = button_reply.id;

            console.log('Opção selecionada: ', selected_option);

            if (selected_option === 'option_1') {
                sendTextMessage(phone_number_id, from, "Você escolheu a Opção 1!");
            } else if (selected_option === 'option_2') {
                sendTextMessage(phone_number_id, from, "Você escolheu a Opção 2!");
            } else if (selected_option === 'option_3') {
                sendTextMessage(phone_number_id, from, "Você escolheu a Opção 3!");
            }
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

app.get('/', (req, res) => {
    res.status(200).send('Hello, world! My name is Hygia.');
});
