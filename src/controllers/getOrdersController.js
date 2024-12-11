// Importar o banco de dados e outras dependências necessárias
const db = require('../config/db'); // Configuração do banco de dados

// Controller para buscar os pedidos da farmácia logada com paginação
exports.getOrdersByPharmacy = async (req, res) => {
    const userId = req.query.userId; // Pega o userId dos parâmetros da URL (query string)
    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const limit = parseInt(req.query.limit) || 10; // Itens por página (padrão: 10)
    const offset = (page - 1) * limit; // Calcular o offset

    // Verifica se o userId foi enviado
    if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório.' });
    }

    try {
        // Consulta para obter os pedidos com paginação
        const [rows] = await db.execute(
            `SELECT * FROM orders
            WHERE pharmacy_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // Verifica se encontrou os pedidos
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Nenhum pedido encontrado para essa farmácia.' });
        }

        // Consulta para contar o total de pedidos (sem paginação)
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total FROM orders WHERE pharmacy_id = ?`,
            [userId]
        );
        const totalOrders = countResult[0].total;
        const totalPages = Math.ceil(totalOrders / limit);

        // Retorna os pedidos com informações de paginação
        return res.status(200).json({
            data: rows,
            pagination: {
                currentPage: page,
                totalOrders,
                totalPages,
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar os pedidos da farmácia:', error);
        // Garante que o erro é tratado e a resposta enviada apenas uma vez
        return res.status(500).json({ message: 'Erro no servidor ao buscar os pedidos da farmácia.' });
    }
};
