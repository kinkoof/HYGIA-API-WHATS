const db = require('../config/db');

exports.listProducts = async (req, res) => {
    const { pharmacy } = req.query;

    if (!pharmacy) {
        return res.status(400).json({ message: 'O ID da farmácia é obrigatório2.' });
    }

    try {
        const [products] = await db.execute('SELECT * FROM products WHERE pharmacy = ?', [pharmacy]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Nenhum produto encontrado para essa farmácia.' });
        }

        return res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao listar os produtos:', error);
        return res.status(500).json({ message: 'Erro no servidor ao listar os produtos.' });
    }
};
