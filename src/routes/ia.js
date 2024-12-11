const express = require('express');
const router = express.Router();
const listDataBaseController = require('../controllers/listDataBaseController');
const sqlQueryController = require('../controllers/sqlQueryController')

router.get('/tables', listDataBaseController.listTables);
router.post('/execute', sqlQueryController.executeQuery);

router.post('/predict', async (req, res) => {
    const { sintomas } = req.body;

    try {
        const remedio = await processSymptoms(sintomas);
        res.json({ remedio });
    } catch (error) {
        res.status(500).json({ error: 'Error processing symptoms' });
    }
});
module.exports = router;
