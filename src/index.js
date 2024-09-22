const express = require('express');
const { verifyWebhook, handleMessage } = require('../src/controllers/webhookController');

const app = express();
app.use(express.json());

app.get('/webhook', verifyWebhook);
app.post('/webhook', handleMessage);

// Configuração do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
