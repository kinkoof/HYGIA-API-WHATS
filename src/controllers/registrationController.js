const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.registerUser = async (req, res) => {
    const {
        pharmacyName,
        cnpj,
        email,
        password,
        passwordConfirm,
        phone,
        street,
        neighborhood,
        city,
        state,
        number,
        cep,
        ownerName,
        ownerCpf,
        ownerPhone,
        ownerEmail,
        bankName,
        agencyNumber,
        accountNumber,
        accountHolder,
        document
    } = req.body;

    if (!pharmacyName || !cnpj || !email || !password || !passwordConfirm || !phone || !street || !neighborhood || !city || !state || !number || !cep || !ownerName || !ownerCpf || !ownerPhone || !ownerEmail || !bankName || !agencyNumber || !accountNumber || !accountHolder) {
        console.log("Valores ausentes:", { pharmacyName, cnpj, email, password, passwordConfirm, phone, street, neighborhood, city, state, number, cep, ownerName, ownerCpf, ownerPhone, ownerEmail, bankName, agencyNumber, accountNumber, accountHolder });
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    // Verificação se as senhas coincidem
    if (password !== passwordConfirm) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM pharmacy WHERE email = ? OR cnpj = ?', [email, cnpj]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'O e-mail ou CNPJ já estão registrados.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO pharmacy
            (pharmacyName, cnpj, email, password, phone, street, neighborhood, city, state, number, cep, ownerName, ownerCpf, ownerPhone, ownerEmail, bankName, agencyNumber, accountNumber, accountHolder, document)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                pharmacyName,
                cnpj,
                email,
                hashedPassword,
                phone,
                street,
                neighborhood,
                city,
                state,
                number,
                cep,
                ownerName,
                ownerCpf,
                ownerPhone,
                ownerEmail,
                bankName,
                agencyNumber,
                accountNumber,
                accountHolder,
                document
            ]
        );

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};
