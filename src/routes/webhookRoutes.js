const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.get('/', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Forbidden');
        }
    } else {
        res.status(400).send('Bad Request');
    }
});

router.post('/', webhookController.handleWebhook);

module.exports = router;
