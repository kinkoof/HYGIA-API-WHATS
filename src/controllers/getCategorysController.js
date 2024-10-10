const db = require('../config/db');

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.execute('SELECT id, nome FROM categories');

        res.status(200).json({ categories });
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar categorias.' });
    }
};
