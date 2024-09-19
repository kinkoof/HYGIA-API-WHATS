const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

// Import routes
const webhookRoutes = require('./routes/webhookRoutes');

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/webhook', webhookRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
