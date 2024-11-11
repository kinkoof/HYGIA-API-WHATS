const db = require('../config/db');

exports.addProduct = async (req, res) => {
    const { name, category, pharmacy, price, prescription } = req.body;

    if (!name || !category || !pharmacy || !price || !prescription) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const query = `
            INSERT INTO products
            (name, category, pharmacy, price, prescription)
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [name, category, pharmacy, price, prescription];

        const [result] = await db.execute(query, values);

        res.status(201).json({ message: 'Produto criado com sucesso!', productId: result.insertId });
    } catch (error) {
        console.error('Erro ao criar o produto:', error);
        res.status(500).json({ message: 'Erro no servidor ao criar o produto.' });
    }
};
