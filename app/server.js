const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('../routes/webhookRoutes');
const { PORT } = require('../config/envConfig');

const app = express();
app.use(bodyParser.json());

app.use('/', webhookRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
