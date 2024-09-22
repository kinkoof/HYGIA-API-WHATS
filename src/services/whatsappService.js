const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');

// Enviar mensagem de botões
const sendButtonsMessage = async (phone_number_id, from) => {
    try {
        const response = await axios({
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
                                    id: "buy",
                                    title: "Comprar Remédio"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "register",
                                    title: "Se registrar"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "login",
                                    title: "Login"
                                }
                            }
                        ]
                    }
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log('Botões enviados com sucesso:', response.data);
    } catch (error) {
        console.error('Erro ao enviar botões:', error.response ? error.response.data : error.message);
    }
};

// Enviar mensagem de texto
const sendTextMessage = async (phone_number_id, from, message) => {
    try {
        const response = await axios({
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
        });
        console.log('Mensagem enviada com sucesso:', response.data);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.response ? error.response.data : error.message);
    }
};

module.exports = {
    sendButtonsMessage,
    sendTextMessage
};
