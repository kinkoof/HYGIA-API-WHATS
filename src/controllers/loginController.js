const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importando JWT
const db = require('../config/db');

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Verificação se os campos obrigatórios estão presentes
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // Buscando o usuário pelo e-mail no banco de dados
        const [rows] = await db.execute('SELECT * FROM pharmacys WHERE email = ?', [email]);

        // Verifica se o usuário foi encontrado
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Usuário não encontrado.' });
        }

        const user = rows[0];

        // Comparação da senha fornecida com a senha armazenada (criptografada)
        const isMatch = await bcrypt.compare(password, user.password);

        // Verifica se a senha está correta
        if (isMatch) {
            return res.status(400).json({ message: 'Senha incorreta.' });
        }

        // Geração do token JWT, incluindo o ID do usuário no payload
        const token = jwt.sign(
            { userId: user.id, email: user.email }, // Payload
            process.env.JWT_SECRET || 'secreta_jwt', // Chave secreta
            { expiresIn: '1h' } // Tempo de expiração
        );

        // Enviar o token e uma mensagem de sucesso
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            userId: user.id,
            email: user.email
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};
