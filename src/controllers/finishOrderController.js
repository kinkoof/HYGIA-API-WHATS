const db = require('../config/db');
const { sendProactiveMessageWithButtons } = require('../services/whatsappService'); // Importar a função correta

exports.finishOrder = async (req, res) => {
    const { orderId, pharmacyId } = req.body;

    if (!orderId || !pharmacyId) {
        return res.status(400).send('Faltam parâmetros necessários: orderId ou pharmacyId.');
    }

    try {
        // Atualizar o status do pedido
        const [result] = await db.execute(
            `UPDATE orders
             SET status = 'f', pharmacy_id = ?
             WHERE id = ?`,
            [pharmacyId, orderId]
        );

        if (result.affectedRows === 0) {
            console.log(`Erro: Nenhuma ordem encontrada ou a farmácia não pode finalizar o pedido ${orderId}.`);
            return res.status(400).json({ success: false, message: 'Erro ao finalizar o pedido.' });
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
        const message = `Seu pedido foi finalizado pela farmacia, você recebeu seus itens?`;
        const buttons = [
            { id: 'order_finished', title: 'Sim' },
            { id: 'order_not_finished', title: 'Não' },
        ];
        const notificationResult = await sendProactiveMessageWithButtons(userPhone, message, buttons);

        if (!notificationResult.success) {
            console.log(`Falha ao enviar notificação para o telefone ${userPhone}.`);
            return res.status(500).json({ success: false, message: 'Erro ao enviar notificação ao cliente.' });
        }

        return res.status(200).json({ success: true, message: 'Pedido aceito e cliente notificado.' });

    } catch (error) {
        console.error('Erro ao aceitar pedido:', error.message);
        console.error(error.stack);
        return res.status(500).send('Erro ao processar a solicitação.');
    }
};
