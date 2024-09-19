const express = require('express');
const { verifyWebhook, handleMessage } = require('../controllers/webhookController');

const router = express.Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleMessage);

module.exports = router;
