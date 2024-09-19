// src/utils/validators.js
const bcrypt = require('bcrypt');

const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

module.exports = { validateEmail, hashPassword };
