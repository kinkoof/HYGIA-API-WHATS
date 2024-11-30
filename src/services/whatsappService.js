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
const sendProactiveMessage = async (to, messageText) => {
    const url = `https://graph.facebook.com/v19.0/434839199709985/messages`;

    const messageData = {
        messaging_product: 'whatsapp',
        to,
        text: { body: messageText }
    };

    try {
        // Enviando a requisição usando axios
        const response = await axios.post(url, messageData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Verificando a resposta para garantir sucesso
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                setOrders(orders.map(order =>
                    order.id === orderId ? { ...order, status: 'a' } : order
                ));
                alert('Pedido aceito com sucesso!');
            } else {
                setError(data.message || 'Erro desconhecido ao enviar o pedido.');
            }
        } else {
            const data = await response.json();
            setError(data.message || 'Erro ao processar o envio do pedido.');
        }
    } catch (err) {
        console.error('Erro no processo de envio do pedido:', err);
        setError('Erro ao processar o envio do pedido.');
    }
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
