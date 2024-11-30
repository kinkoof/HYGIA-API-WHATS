const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');

const sendWhatsAppMessage = (phone_number_id, to, text, res, buttons = null, isLocationRequest = false, headerText = 'Sauris') => {
    let messageData;

    if (isLocationRequest) {
        messageData = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'location_request_message',
                body: {
                    text
                },
                action: {
                    name: 'send_location'
                }
            }
        };
    } else {
        messageData = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: buttons ? 'interactive' : 'text',
            ...(buttons ? {
                interactive: {
                    type: 'button',
                    header: { type: 'text', text: headerText },  // Use headerText parameter here
                    body: { text },
                    action: { buttons: buttons.map(button => ({ type: 'reply', reply: button })) }
                }
            } : {
                text: { body: text }
            })
        };
    }

    axios.post(`https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`, messageData)
        .then(() => res.sendStatus(200))
        .catch(error => {
            console.error('Error sending message:', error);
            res.sendStatus(500);
        });
};

// Função para envio proativo de mensagens no WhatsApp
const sendProactiveMessage = (phone_number_id, to, messageText) => {
    const url = `https://graph.facebook.com/v19.0/${phone_number_id}/messages`;

    const messageData = {
        messaging_product: 'whatsapp',
        to,
        text: { body: messageText }
    };

    axios.post(url, messageData, {
        headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log(`Mensagem proativa enviada para ${to}:`, response.data);
        })
        .catch(error => {
            console.error('Erro ao enviar mensagem proativa:', error.response?.data || error.message);
        });
};


const sendWhatsAppList = (phone_number_id, to, listData, res) => {
    const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
            type: 'list',
            header: {
                type: 'text',
                text: listData.headerText || 'Escolha uma opção'
            },
            body: {
                text: listData.bodyText || 'Escolha uma opção abaixo'
            },
            footer: {
                text: listData.footerText || ''
            },
            action: {
                button: listData.buttonText || 'Opções',
                sections: listData.sections
            }
        }
    };

    // Log the actual message data before sending it
    console.log('Message data to be sent:', JSON.stringify(messageData, null, 2));

    axios.post(`https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`, messageData)
        .then(() => res.sendStatus(200))
        .catch(error => {
            console.error('Error sending list message:', error);
            res.sendStatus(500);
        });
};

module.exports = { sendWhatsAppMessage, sendWhatsAppList, sendProactiveMessage };
