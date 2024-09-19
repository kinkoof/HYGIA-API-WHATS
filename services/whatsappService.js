const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/envConfig');

exports.sendInteractiveMessage = (phoneNumberId, to) => {
    return axios.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages?access_token=${ACCESS_TOKEN}`, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "button",
            header: {
                type: "text",
                text: "Bem Vindo"
            },
            body: {
                text: "Bem vindo ao Hygia, como podemos te ajudar hoje?"
            },
            action: {
                buttons: [
                    { type: "reply", reply: { id: "buy", title: "Comprar medicamentos" } },
                    { type: "reply", reply: { id: "login", title: "Entrar em sua conta" } },
                    { type: "reply", reply: { id: "register", title: "Se registrar" } }
                ]
            }
        }
    }, {
        headers: { "Content-Type": "application/json" }
    });
};
