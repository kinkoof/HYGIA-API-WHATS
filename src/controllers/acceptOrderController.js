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
             WHERE id = ?`,
            [pharmacyId, orderId]  // Remover a parte `AND pharmacy_id = ?` para teste
        );


        if (result.affectedRows === 0) {
            console.log(`Erro: Nenhuma ordem encontrada ou a farmácia não pode aceitar o pedido ${orderId}.`);
            return res.status(400).json({ success: false, message: 'Erro ao aceitar o pedido.' });
        }

        // Responder com sucesso
        return res.status(200).json({ success: true, message: 'Pedido aceito.' });

    }catch (error) {
        console.error('Erro ao aceitar pedido:', error.message);
        console.error(error.stack);
        return res.status(500).send('Erro ao processar a solicitação.');
    }

};
