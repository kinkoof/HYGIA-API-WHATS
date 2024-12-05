const express = require('express');
const router = express.Router();
const listDataBaseController = require('../controllers/listDataBaseController');
const sqlQueryController = require('../controllers/sqlQueryController')

router.get('/tables', listDataBaseController.listTables);
router.post('/execute', sqlQueryController.executeQuery);


module.exports = router;
