// denyOrderController.js
const db = require('../config/db');

exports.denyOrder = async (phone_number_id, pharmacyId, orderId, res) => {
    // Verifique se os parâmetros necessários foram passados
    if (!orderId || !pharmacyId) {
        return res.status(400).send('Faltam parâmetros necessários: orderId ou pharmacyId.');
    }

    try {
        // Atualizar o status da ordem para "r" (recusado pela farmácia)
        const [result] = await db.execute(
            `UPDATE orders
             SET status = 'x', pharmacy_id = ?
             WHERE id = ? AND pharmacy_id = ?`,
            [pharmacyId, orderId, pharmacyId]
        );

        if (result.affectedRows === 0) {
            console.log(`Erro: Nenhuma ordem encontrada ou a farmácia não pode recusar o pedido ${orderId}.`);
            return res.status(400).json({ success: false, message: 'Erro ao recusar o pedido.' });
        }

        // Responder com sucesso
        return res.status(200).json({ success: true, message: 'Pedido recusado.' });

    } catch (error) {
        console.error('Erro ao recusar pedido:', error);
        return res.status(500).send('Erro ao processar a solicitação.');
    }
};
