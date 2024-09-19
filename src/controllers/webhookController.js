const { sendButtonsMessage, sendTextMessage } = require('../services/whatsappService');

// Função para lidar com mensagens recebidas
const handleWebhook = (req, res) => {
    let body = req.body;

    if (body.object) {
        const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from;

        // Verificar se a mensagem é um texto inicial
        if (body.entry[0].changes[0].value.messages[0].text) {
            const received_message = body.entry[0].changes[0].value.messages[0].text.body;
            console.log('Mensagem recebida: ', received_message);

            // Enviar botões de opções
            sendButtonsMessage(phone_number_id, from);
        }

        // Verificar se é uma resposta com botões
        if (body.entry[0].changes[0].value.messages[0].interactive) {
            const button_reply = body.entry[0].changes[0].value.messages[0].interactive.button_reply;
            const selected_option = button_reply.id;

            console.log('Opção selecionada: ', selected_option);

            // Enviar mensagem com base na escolha do botão
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
};

module.exports = {
    handleWebhook
};
