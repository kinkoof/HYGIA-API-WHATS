// Importar o banco de dados e outras dependências necessárias
const db = require('../config/db'); // Configuração do banco de dados

// Controller para buscar a informação da taxa de entrega (deliveryFee) da farmácia
exports.getPharmacyDeliveryFee = async (req, res) => {
    const userId = req.query.userId; // Pega o userId dos parâmetros da URL (query string)

    // Verifica se o userId foi enviado
    if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório.' });
    }

    try {
        // Consulta para obter apenas o campo deliveryFee da farmácia pelo userId
        const [rows] = await db.execute('SELECT deliveryFee FROM pharmacys WHERE id = ?', [userId]);

        // Verifica se encontrou a farmácia
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Perfil da farmácia não encontrado.' });
        }

        // Retorna o campo deliveryFee da farmácia
        return res.status(200).json({ deliveryFee: rows[0].deliveryFee });

    } catch (error) {
        console.error('Erro ao buscar o perfil da farmácia:', error);
        // Garante que o erro é tratado e a resposta enviada apenas uma vez
        return res.status(500).json({ message: 'Erro no servidor ao buscar o perfil da farmácia.' });
    }
};
