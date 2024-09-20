const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Rota para verificar o webhook
router.get('/', webhookController.verifyWebhook);

// Rota para processar mensagens
router.post('/', webhookController.handleMessage);

module.exports = router;
