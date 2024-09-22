const bcrypt = require('bcrypt');

// Valida se a senha contém pelo menos uma letra maiúscula e tem no mínimo 8 caracteres
const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z]).{8,}$/;
    return regex.test(password);
};

// Gera um hash da senha para armazenamento seguro
const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

// Verifica se duas senhas são iguais
const confirmPassword = (password, confirmPassword) => {
    return password === confirmPassword;
};

module.exports = { validatePassword, hashPassword, confirmPassword };
