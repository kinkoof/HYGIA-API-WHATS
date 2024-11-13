const db = require('../config/db');

exports.denyOrder = async (req, res) => {
    const { orderId, pharmacyId } = req.body;

    // Verifique se os parâmetros necessários foram passados
    if (!orderId || !pharmacyId) {
        return res.status(400).send('Faltam parâmetros necessários: orderId ou pharmacyId.');
    }

    try {
        // Atualizar o status da ordem para "a" (aceito pela farmácia)
        const [result] = await db.execute(
            `UPDATE orders
             SET status = 'x', pharmacy_id = ?
             WHERE id = ?`,
            [pharmacyId, orderId]  // Remover a parte `AND pharmacy_id = ?` para teste
        );


        if (result.affectedRows === 0) {
            console.log(`Erro: Nenhuma ordem encontrada ou a farmácia não pode rejeitar o pedido ${orderId}.`);
            return res.status(400).json({ success: false, message: 'Erro ao rejeitar o pedido.' });
        }

        // Responder com sucesso
        return res.status(200).json({ success: true, message: 'Pedido rejeitado.' });

    }catch (error) {
        console.error('Erro ao rejeitar pedido:', error.message);
        console.error(error.stack);
        return res.status(500).send('Erro ao processar a solicitação.');
    }

};
