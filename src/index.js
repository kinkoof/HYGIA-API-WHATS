const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { handleWebhook } = require('./controllers/webhookController');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', handleWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
