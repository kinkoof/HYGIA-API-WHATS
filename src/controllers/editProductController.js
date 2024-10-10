const db = require('../config/db'); // Certifique-se de que o caminho está correto

exports.editProduct = async (req, res) => {
    const {
        name,
        description,
        price,
        stock_quantity,
        image_url
    } = req.body; // Campos para atualizar

    const productId = req.params.id; // Pega o ID do produto da URL

    // Verifica se o ID do produto foi fornecido
    if (!productId) {
        return res.status(400).json({ message: 'ID do produto é obrigatório para a atualização.' });
    }

    // Prepara os campos para atualização dinamicamente
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (description) fieldsToUpdate.description = description;
    if (price !== undefined) fieldsToUpdate.price = price;
    if (stock_quantity !== undefined) fieldsToUpdate.stock_quantity = stock_quantity;
    if (image_url) fieldsToUpdate.image_url = image_url;

    // Obtém os nomes dos campos e seus valores
    const fieldNames = Object.keys(fieldsToUpdate);
    const fieldValues = Object.values(fieldsToUpdate);

    // Se nenhum campo for fornecido para atualização
    if (fieldNames.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar foi fornecido.' });
    }

    try {
        // Cria a query dinamicamente com base nos campos fornecidos
        const query = `UPDATE products SET ${fieldNames.map(field => `${field} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        fieldValues.push(productId); // Adiciona o ID do produto como o último parâmetro
        await db.execute(query, fieldValues);

        return res.status(200).json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar o produto:', error);
        return res.status(500).json({ message: 'Erro no servidor ao atualizar o produto.' });
    }
};
