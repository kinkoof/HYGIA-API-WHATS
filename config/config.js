require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    VERIFY_TOKEN: process.env.VERIFY_TOKEN,
};
