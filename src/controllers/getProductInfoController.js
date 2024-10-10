const db = require('../config/db'); // Certifique-se de que o caminho está correto

exports.getProductInfo = async (req, res) => {
    const { id } = req.params; // Pega o ID do produto da URL

    if (!id) {
        return res.status(400).json({ message: 'ID do produto é obrigatório.' });
    }

    try {
        // Consulta ao banco de dados para buscar as informações do produto com o ID fornecido
        const [product] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);

        if (product.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Retorna as informações do produto
        return res.status(200).json(product[0]);
    } catch (error) {
        console.error('Erro ao buscar informações do produto:', error);
        return res.status(500).json({ message: 'Erro no servidor ao buscar informações do produto.' });
    }
};
