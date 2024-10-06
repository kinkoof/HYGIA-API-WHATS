const saveUserToDatabase = (from, userData) => {
    console.log('Salvando no banco de dados:', { from, ...userData });
};


module.exports = { saveUserToDatabase };