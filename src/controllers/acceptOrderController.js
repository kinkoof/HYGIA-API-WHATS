// acceptOrderController.js
const db = require('../config/db');
const { sendWhatsAppMessage } = require('../services/whatsappService');

exports.acceptOrder = async (req, res) => {
    const { orderId, pharmacyId } = req.body;

    // Verifique se os parâmetros necessários foram passados
    if (!orderId || !pharmacyId) {
        return res.status(400).send('Faltam parâmetros necessários: orderId ou pharmacyId.');
    }

    try {
        // Atualizar o status da ordem para "a" (aceito pela farmácia)
        const [result] = await db.execute(
            `UPDATE orders
             SET status = 'a', pharmacy_id = ?
             WHERE id = ? AND pharmacy_id = ?`,
            [pharmacyId, orderId, pharmacyId]
        );

        if (result.affectedRows === 0) {
            console.log(`Erro: Nenhuma ordem encontrada ou a farmácia não pode aceitar o pedido ${orderId}.`);
            return res.status(400).send('Erro ao aceitar o pedido.');
        }

        // Obter informações do usuário para notificação
        const [userData] = await db.execute(
            `SELECT user_phone
             FROM orders
             WHERE id = ?`,
            [orderId]
        );

        if (userData.length === 0) {
            console.log('Erro: Não foi possível encontrar o número de telefone do usuário.');
            return res.status(400).send('Erro ao buscar dados do usuário.');
        }

        const userPhone = userData[0].user_phone;

        // Enviar a notificação para o usuário informando que o pedido foi aceito
        const message = `Seu pedido foi aceito pela farmácia e será enviado em breve. Obrigado por escolher nosso serviço!`;

        // Enviar a mensagem via WhatsApp
        await sendWhatsAppMessage(phone_number_id, userPhone, message);

        // Responder com sucesso
        return res.status(200).send('Pedido aceito e notificação enviada.');

    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        return res.status(500).send('Erro ao processar a solicitação.');
    }
};
