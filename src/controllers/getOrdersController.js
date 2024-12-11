// Importar o banco de dados e outras dependências necessárias
const db = require('../config/db'); // Configuração do banco de dados

// Controller para buscar os pedidos da farmácia logada com paginação
exports.getOrdersByPharmacy = async (req, res) => {
    const userId = req.query.userId; // Pega o userId dos parâmetros da URL (query string)
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const limit = parseInt(req.query.limit) || 10; // Limite de itens por página (padrão: 10)
    const offset = (page - 1) * limit; // Calcula o deslocamento para o SQL

    // Verifica se o userId foi enviado
    if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório.' });
    }

    try {
        // Consulta para obter os pedidos da farmácia com o userId, com paginação
        const [rows] = await db.execute(
            'SELECT * FROM orders WHERE pharmacy_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );

        // Consulta para obter o número total de pedidos
        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM orders WHERE pharmacy_id = ?',
            [userId]
        );

        // Retorna os pedidos da farmácia com paginação e o número total
        return res.status(200).json({
            orders: rows,
            total, // Total de pedidos
            currentPage: page,
            totalPages: Math.ceil(total / limit) // Total de páginas
        });
    } catch (error) {
        console.error('Erro ao buscar os pedidos da farmácia:', error);
        // Garante que o erro é tratado e a resposta enviada apenas uma vez
        return res.status(500).json({ message: 'Erro no servidor ao buscar os pedidos da farmácia.' });
    }
};
