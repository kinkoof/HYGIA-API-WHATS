const db = require('../config/db');

exports.editPharmacyProfile = async (req, res) => {
    const {
        pharmacyName,
        cnpj,
        email,
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
        accountHolder
    } = req.body;

    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ message: 'ID da farmácia é obrigatório para a atualização.' });
    }

    const fieldsToUpdate = {};
    if (pharmacyName) fieldsToUpdate.pharmacyName = pharmacyName;
    if (cnpj) fieldsToUpdate.cnpj = cnpj;
    if (email) fieldsToUpdate.email = email;
    if (phone) fieldsToUpdate.phone = phone;
    if (street) fieldsToUpdate.street = street;
    if (neighborhood) fieldsToUpdate.neighborhood = neighborhood;
    if (city) fieldsToUpdate.city = city;
    if (state) fieldsToUpdate.state = state;
    if (number) fieldsToUpdate.number = number;
    if (cep) fieldsToUpdate.cep = cep;
    if (ownerName) fieldsToUpdate.ownerName = ownerName;
    if (ownerCpf) fieldsToUpdate.ownerCpf = ownerCpf;
    if (ownerPhone) fieldsToUpdate.ownerPhone = ownerPhone;
    if (ownerEmail) fieldsToUpdate.ownerEmail = ownerEmail;
    if (bankName) fieldsToUpdate.bankName = bankName;
    if (agencyNumber) fieldsToUpdate.agencyNumber = agencyNumber;
    if (accountNumber) fieldsToUpdate.accountNumber = accountNumber;
    if (accountHolder) fieldsToUpdate.accountHolder = accountHolder;

    const fieldNames = Object.keys(fieldsToUpdate);
    const fieldValues = Object.values(fieldsToUpdate);

    if (fieldNames.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar foi fornecido.' });
    }

    try {
        const query = `UPDATE pharmacys SET ${fieldNames.map(field => `${field} = ?`).join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
        fieldValues.push(userId);
        await db.execute(query, fieldValues);

        return res.status(200).json({ message: 'Perfil da farmácia atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar o perfil da farmácia:', error);
        return res.status(500).json({ message: 'Erro no servidor ao atualizar o perfil da farmácia.' });
    }
};
