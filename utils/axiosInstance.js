const axios = require('axios');
const { ACCESS_TOKEN } = require('../config/config');

const axiosInstance = axios.create({
    baseURL: 'https://graph.facebook.com',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
});

module.exports = axiosInstance;
