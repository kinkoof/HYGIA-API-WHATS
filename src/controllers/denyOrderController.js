const db = require('../config/db');
const { sendProactiveMessage } = require('../services/whatsappService'); // Importar a função correta

exports.denyOrder = async (req, res) => {
    const { orderId, pharmacyId } = req.body;

    // Verifique se os parâmetros necessários foram passados
    if (!orderId || !pharmacyId) {
        return res.status(400).send('Faltam parâmetros necessários: orderId ou pharmacyId.');
    }

    try {
        // Atualizar o status da ordem para "x" (rejeitado pela farmácia)
        const [result] = await db.execute(
            `UPDATE orders
             SET status = 'x', pharmacy_id = ?
             WHERE id = ?`,
            [pharmacyId, orderId]
        );

        if (result.affectedRows === 0) {
            console.log(`Erro: Nenhuma ordem encontrada ou a farmácia não pode rejeitar o pedido ${orderId}.`);
            return res.status(400).json({ success: false, message: 'Erro ao rejeitar o pedido.' });
        }

        // Buscar o número de telefone do cliente
        const [orderDetails] = await db.execute(
            `SELECT o.user_phone
             FROM orders o
             WHERE o.id = ?`,
            [orderId]
        );

        if (orderDetails.length === 0) {
            console.log(`Pedido ${orderId} não encontrado após a atualização.`);
            return res.status(400).json({ success: false, message: 'Erro ao buscar os detalhes do pedido.' });
        }

        const { user_phone: userPhone } = orderDetails[0];

        if (!userPhone) {
            console.log(`Telefone do usuário não encontrado para o pedido ${orderId}.`);
            return res.status(400).json({ success: false, message: 'Telefone do cliente não encontrado.' });
        }

        // Enviar mensagem proativa ao cliente
        const message = `Infelizmente, seu pedido foi rejeitado pela farmácia.`;
        const notificationResult = await sendProactiveMessage(userPhone, message);

        if (!notificationResult.success) {
            console.log(`Falha ao enviar notificação para o telefone ${userPhone}.`);
            return res.status(500).json({ success: false, message: 'Erro ao enviar notificação ao cliente.' });
        }

        return res.status(200).json({ success: true, message: 'Pedido rejeitado e cliente notificado.' });

    } catch (error) {
        console.error('Erro ao rejeitar pedido:', error.message);
        console.error(error.stack);
        return res.status(500).send('Erro ao processar a solicitação.');
    }
};
