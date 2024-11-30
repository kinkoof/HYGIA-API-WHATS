// Importar o banco de dados e outras dependências necessárias
const db = require('../config/db'); // Configuração do banco de dados

// Controller para buscar os pedidos da farmácia logada
exports.getOrdersByPharmacy = async (req, res) => {
    const userId = req.query.userId; // Pega o userId dos parâmetros da URL (query string)

    // Verifica se o userId foi enviado
    if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório.' });
    }

    try {
        // Consulta para obter os pedidos da farmácia com o userId, ordenados do mais recente para o mais antigo
        const [rows] = await db.execute('SELECT * FROM orders WHERE pharmacy_id = ? ORDER BY created_at DESC', [userId]);

        // Verifica se encontrou os pedidos
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Nenhum pedido encontrado para essa farmácia.' });
        }

        // Retorna os pedidos da farmácia
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar os pedidos da farmácia:', error);
        // Garante que o erro é tratado e a resposta enviada apenas uma vez
        return res.status(500).json({ message: 'Erro no servidor ao buscar os pedidos da farmácia.' });
    }
};
