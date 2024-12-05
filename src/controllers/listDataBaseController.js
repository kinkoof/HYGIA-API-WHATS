const db = require('../config/db');

exports.listTables = async (req, res) => {
    try {
        const [tables] = await db.execute('SHOW TABLES');

        const tableNames = tables.map(table => Object.values(table)[0]);

        if (tableNames.length === 0) {
            return res.status(404).json({ message: 'Nenhuma tabela encontrada no banco de dados.' });
        }

        return res.status(200).json({ tables: tableNames });
    } catch (error) {
        console.error('Erro ao listar as tabelas:', error);
        return res.status(500).json({ message: 'Erro no servidor ao listar as tabelas.' });
    }
};
