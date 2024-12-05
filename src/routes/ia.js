const express = require('express');
const router = express.Router();
const listDataBase = require('../controllers/listDataBase');

router.get('/tables', listDataBase.listTables);
