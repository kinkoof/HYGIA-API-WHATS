const db = require('../config/db');

exports.addProduct = async (req, res) => {
    const { name, description, category_id, pharmacy_id, price, stock_quantity } = req.body;

    // Verificação corrigida para `stock_quantity`
    if (!name || !description || !category_id || !pharmacy_id || !price || !stock_quantity) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const query = `
            INSERT INTO products
            (name, description, category_id, pharmacy_id, price, stock_quantity)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [name, description, category_id, pharmacy_id, price, stock_quantity];

        const [result] = await db.execute(query, values);

        res.status(201).json({ message: 'Produto criado com sucesso!', productId: result.insertId });
    } catch (error) {
        console.error('Erro ao criar o produto:', error);
        res.status(500).json({ message: 'Erro no servidor ao criar o produto.' });
    }
};
