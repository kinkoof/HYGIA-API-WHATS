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

const sendProactiveMessage = async (to, messageText) => {
    const url = `https://graph.facebook.com/v19.0/434839199709985/messages`;

    const messageData = {
        messaging_product: 'whatsapp',
        to,
        text: { body: messageText }
    };

    try {
        const response = await axios.post(url, messageData, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Mensagem proativa enviada para ${to}:`, response.data);

        return { success: true, data: response.data };

    } catch (error) {
        console.error('Erro ao enviar mensagem proativa:', error.response?.data || error.message);

        return { success: false, error: error.response?.data || error.message };
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

// const sendWhatsAppPayment = (phone_number_id, to, paymentData, res) => {
//     const messageData = {
//         messaging_product: 'whatsapp',
//         recipient_type: 'individual',
//         to,
//         type: 'interactive',
//         interactive: {
//             type: 'order_payment',
//             body: {
//                 text: 'Por favor, realize o pagamento do seu pedido!'
//             },
//             footer: {
//                 text: paymentData.footerText || 'Obrigado pela sua compra!'
//             },
//             action: {
//                 name: 'review_and_pay',
//                 parameters: {
//                     reference_id: paymentData.referenceId,
//                     type: paymentData.type || 'physical-goods',
//                     beneficiaries: [
//                         {
//                             name: paymentData.beneficiaryName,
//                             address_line1: paymentData.addressLine1,
//                             address_line2: paymentData.addressLine2 || '',
//                             city: paymentData.city || '',
//                             state: paymentData.state || '',
//                             country: paymentData.country || 'BR',
//                             postal_code: paymentData.postalCode
//                         }
//                     ],
//                     payment_type: paymentData.paymentType || 'p2m-lite:stripe',
//                     payment_configuration: paymentData.paymentConfiguration,
//                     currency: paymentData.currency || 'BRL',  // Ensure currency is correct
//                     total_amount: {
//                         value: paymentData.totalAmountValue,
//                         offset: 100
//                     },
//                     order: {
//                         status: 'pending',
//                         items: paymentData.items.map(item => ({
//                             retailer_id: item.retailerId,
//                             name: item.name,
//                             amount: {
//                                 value: item.amountValue,
//                                 offset: 100
//                             },
//                             quantity: item.quantity,
//                             sale_amount: {
//                                 value: item.saleAmountValue || item.amountValue,
//                                 offset: 100
//                             }
//                         })),
//                         subtotal: {
//                             value: paymentData.subtotalValue,
//                             offset: 100
//                         },
//                         tax: paymentData.taxValue ? {
//                             value: paymentData.taxValue,
//                             offset: 100,
//                             description: paymentData.taxDescription || ''
//                         } : undefined,
//                         shipping: paymentData.shippingValue ? {
//                             value: paymentData.shippingValue,
//                             offset: 100,
//                             description: paymentData.shippingDescription || ''
//                         } : undefined,
//                         discount: paymentData.discountValue ? {
//                             value: paymentData.discountValue,
//                             offset: 100,
//                             description: paymentData.discountDescription || '',
//                             discount_program_name: paymentData.discountProgramName || ''
//                         } : undefined,
//                         expiration: paymentData.expiration ? {
//                             timestamp: paymentData.expiration.timestamp,
//                             description: paymentData.expiration.description
//                         } : undefined
//                     }
//                 }
//             }
//         }
//     };

//     console.log('Message data to be sent:', JSON.stringify(messageData, null, 2));

//     axios.post(
//         `https://graph.facebook.com/v19.0/${phone_number_id}/messages?access_token=${ACCESS_TOKEN}`,
//         messageData
//     )
//         .then(() => res.sendStatus(200))
//         .catch(error => {
//             console.error('Error sending payment message:', error);
//             res.sendStatus(500);
//         });
// };


module.exports = { sendWhatsAppMessage, sendWhatsAppList, sendProactiveMessage, sendWhatsAppPayment };
