const db = require('../config/db');

exports.editPharmacyDeliveryFee = async (req, res) => {
    const { deliveryFee } = req.body; // Pegando o campo deliveryFee do corpo da requisição
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ message: 'ID da farmácia é obrigatório para a atualização.' });
    }

    // Verifica se o campo deliveryFee foi fornecido
    if (deliveryFee === undefined) {
        return res.status(400).json({ message: 'Campo deliveryFee é obrigatório.' });
    }

    try {
        const query = `UPDATE pharmacys SET deliveryFee = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
        await db.execute(query, [deliveryFee, userId]);

        return res.status(200).json({ message: 'Taxa de entrega atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar a taxa de entrega da farmácia:', error);
        return res.status(500).json({ message: 'Erro no servidor ao atualizar a taxa de entrega da farmácia.' });
    }
};
