const express = require('express');
const router = express.Router();
const listDataBaseController = require('../controllers/listDataBaseController');

router.get('/tables', listDataBaseController.listTables);
