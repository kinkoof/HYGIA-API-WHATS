const db = require('../config/db'); // Certifique-se de que o caminho está correto

exports.deleteProduct = async (req, res) => {
    const { id } = req.params; // Pega o ID do produto da URL

    // Verifica se o ID do produto foi fornecido
    if (!id) {
        return res.status(400).json({ message: 'ID do produto é obrigatório para a exclusão.' });
    }

    try {
        // Deleta o produto do banco de dados
        const [result] = await db.execute('DELETE FROM products WHERE id = ?', [id]);

        // Verifica se algum produto foi deletado
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Se deletado com sucesso
        return res.status(200).json({ message: 'Produto deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar o produto:', error);
        return res.status(500).json({ message: 'Erro no servidor ao deletar o produto.' });
    }
};
