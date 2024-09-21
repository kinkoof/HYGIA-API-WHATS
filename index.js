const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const webhookRoutes = require('./routes/webhook');

const app = express();

// Middlewares
app.use(bodyParser.json());

// Rotas
app.use('/webhook', webhookRoutes);

// Iniciar servidor
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
