const express = require('express');
const bodyParser = require('body-parser');
const { PORT } = require('./config/config');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(bodyParser.json());
app.use(webhookRoutes);

app.get('/', (req, res) => {
    res.status(200).send('Hello, world! My name is Hygia');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
