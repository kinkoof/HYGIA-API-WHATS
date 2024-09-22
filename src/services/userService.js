const saveUserToDatabase = (from, userData) => {
    console.log('Salvando no banco de dados:', { from, ...userData });
    // Lógica para salvar no banco de dados (MySQL ou outro)
};

module.exports = { saveUserToDatabase };
