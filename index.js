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

app.post('/webhook', (req, res) => {
    let body = req.body;

    console.log(JSON.stringify(body, null, 2));

    if (body.object) {
        console.log('Body object exists');

        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            console.log('Message object detected');

            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let msg = body.entry[0].changes[0].value.messages[0].text.body;

            console.log('phone number: ' + phone_number_id)
            console.log('from: ' + from)
            console.log('message: ' + msg)

            axios({
                method: "POST",
                url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
                data: {
                    recipient_type: "individual",
                    messaging_product: "whatsapp",
                    to: from,
                    type: "interactive",
                    interactive: {
                        type: "flow",
                        header: {
                            type: "text",
                            text: "Flow message header"
                        },
                        body: {
                            text: "Flow message body"
                        },
                        footer: {
                            text: "Flow message footer"
                        },
                        action: {
                            name: "flow",
                            parameters: {
                                flow_message_version: "3",
                                flow_token: "AQAAAAACS5FpgQ_cAAAAAD0QI3s.",
                                flow_id: "1",
                                flow_cta: "Book!",
                                flow_action: "navigate",
                                flow_action_payload: {
                                    screen: "<SCREEN_NAME>",
                                    data: {
                                        product_name: "name",
                                        product_description: "description",
                                        product_price: 100
                                    }
                                }
                            }
                        }
                    }
                },
                headers: {
                    "Content-Type": "application/json"
                }
            })
            res.sendStatus(200)
        } else {
            res.sendStatus(404)
        }
    }
});


app.get('/', (req, res) => {
    res.status(200).send('Hello, word! my name is Hygia')
})


