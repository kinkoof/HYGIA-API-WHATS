const db = require('../config/db');

exports.listProductsInsert = async (req, res) => {
    try {
        // Consulta para listar todos os produtos
        const [products] = await db.execute('SELECT * FROM productsInsert');

        // Verifica se encontrou algum produto
        if (products.length === 0) {
            return res.status(404).json({ message: 'Nenhum remédio encontrado.' });
        }

        // Retorna os produtos encontrados
        return res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao listar os remédios:', error);
        return res.status(500).json({ message: 'Erro no servidor ao listar os remédios.' });
    }
};
