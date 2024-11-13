// acceptOrderController.js
const db = require('../config/db');

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

        // Responder com sucesso
        return res.status(200).send('Pedido aceito.');

    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        return res.status(500).send('Erro ao processar a solicitação.');
    }
};
