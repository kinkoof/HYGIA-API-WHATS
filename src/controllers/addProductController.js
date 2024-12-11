const db = require('../config/db');

exports.addProduct = async (req, res) => {
    const { name, category, pharmacy, price, prescription } = req.body;

    if (!name || !pharmacy || !price ) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const query = `
            INSERT INTO products
            (name, pharmacy, price)
            VALUES (?, ?, ?)
        `;
        const values = [name, pharmacy, price];

        const [result] = await db.execute(query, values);

        res.status(201).json({ message: 'Produto criado com sucesso!', productId: result.insertId });
    } catch (error) {
        console.error('Erro ao criar o produto:', error);
        res.status(500).json({ message: 'Erro no servidor ao criar o produto.' });
    }
};
