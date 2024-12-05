const db = require('../config/db');

exports.executeQuery = async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ message: 'A query SQL é obrigatória.' });
    }

    const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE'];
    const queryWords = query.toUpperCase().split(/\s+/);

    const containsForbidden = forbiddenKeywords.some(keyword => queryWords.includes(keyword));

    if (containsForbidden) {
        return res.status(403).json({
            success: false,
            message: 'A query contém operações não permitidas (ex.: INSERT, UPDATE, DELETE).'
        });
    }

    try {
        const [result] = await db.query(query);
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('Erro ao executar a query:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao executar a query.',
            error: error.message
        });
    }
};

