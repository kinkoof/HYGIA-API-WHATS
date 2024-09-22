const mysql = require('mysql2');
const { HOST, USER, PASSWORD_DB, DATABASE } = require('./config/config');

const connection = mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD_DB,
    database: DATABASE
});

connection.connect((error) => {
    if (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
    console.log('Database connected successfully');
});

module.exports = connection;
