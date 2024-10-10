const db = require('../config/db'); // Certifique-se de que o caminho está correto

exports.listProducts = async (req, res) => {
    const { pharmacy_id } = req.query; // Obter o ID da farmácia da query string

    if (!pharmacy_id) {
        return res.status(400).json({ message: 'O ID da farmácia é obrigatório.' });
    }

    try {
        // Consulta ao banco de dados para buscar produtos específicos da farmácia
        const [products] = await db.execute('SELECT * FROM products WHERE pharmacy_id = ?', [pharmacy_id]);

        // Verifica se há produtos
        if (products.length === 0) {
            return res.status(404).json({ message: 'Nenhum produto encontrado para essa farmácia.' });
        }

        // Retorna a lista de produtos em formato JSON
        return res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao listar os produtos:', error);
        return res.status(500).json({ message: 'Erro no servidor ao listar os produtos.' });
    }
};
