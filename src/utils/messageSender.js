// src/utils/messageSender.js
const axios = require('axios');
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const sendTextMessage = async (phone_number_id, to, text) => {
    await axios({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
        data: {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: {
                body: text
            }
        },
        headers: {
            "Content-Type": "application/json"
        }
    });
};

module.exports = { sendTextMessage };
