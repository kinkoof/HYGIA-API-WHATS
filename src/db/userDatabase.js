const db = require('../src/db');

const saveUserToDatabase = (from, userData) => {
    const { phoneNumber, password, email, location } = userData;

    const query = 'INSERT INTO pharmacies (number, password, email, location) VALUES (?, ?, ?, ?)';
    db.query(query, [phoneNumber, password, email, location], (error, results) => {
        if (error) {
            console.error('Error saving to database:', error);
        } else {
            console.log('User saved successfully:', results);
        }
    });
};

module.exports = saveUserToDatabase;
