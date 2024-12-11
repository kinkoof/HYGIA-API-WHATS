const axios = require('axios');

const processSymptoms = async (symptoms) => {
    try {
        const response = await axios.post('https://hygia-api-whats.onrender.com/ia/processa_sintomas', { sintomas: symptoms });
        return response.data.remedio;
    } catch (error) {
        console.error('Error communicating with Python service:', error);
        throw error;
    }
};

module.exports = { processSymptoms };
