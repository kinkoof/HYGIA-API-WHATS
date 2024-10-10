// Importar o banco de dados e outras dependências necessárias
const db = require('../config/db'); // Configuração do banco de dados

// Controller para buscar as informações do perfil da farmácia
exports.getPharmacyProfile = async (req, res) => {
    const userId = req.query.userId; // Pega o userId dos parâmetros da URL (query string)

    // Verifica se o userId foi enviado
    if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório.' });
    }

    try {
        // Consulta para obter as informações da farmácia pelo userId
        const [rows] = await db.execute('SELECT * FROM pharmacy WHERE id = ?', [userId]);

        // Verifica se encontrou a farmácia
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Perfil da farmácia não encontrado.' });
        }

        // Retorna os dados da farmácia
        return res.status(200).json(rows[0]);

        console.log(res.status(200).json(rows[0])
    )

    } catch (error) {
        console.error('Erro ao buscar o perfil da farmácia:', error);
        // Garante que o erro é tratado e a resposta enviada apenas uma vez
        return res.status(500).json({ message: 'Erro no servidor ao buscar o perfil da farmácia.' });
    }
};
