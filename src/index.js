const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const webhookRoutes = require('../src/routes/webhook');
const authRoutes = require('../src/routes/user');
const iaRoutes = require('../src/routes/ia');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/webhook', webhookRoutes);
app.use('/auth', authRoutes);
app.use('/ia', iaRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: 'Rota não encontrada!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
