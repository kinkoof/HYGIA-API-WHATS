const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
require('dotenv').config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(bodyParser.json());

app.listen(process.env.PORT, () => {
    console.log('Server is running on port ' + (process.env.PORT));
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

    // Log the incoming request
    console.log('Received POST request:', JSON.stringify(body, null, 2));

    if (body.object) {
        console.log('Body object exists');

        if (body.entry &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            console.log('Message object detected');

            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let msg = body.entry[0].changes[0].value.messages[0].text.body;

            console.log(`Sending message to: ${from}`);

            axios({
                method: "POST",
                url: `https://graph.facebook.com/v20.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    text: {
                        body: "Bem Vindo ao Hygia"
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

