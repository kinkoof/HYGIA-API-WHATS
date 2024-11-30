const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const loginController = require('../controllers/loginController');
const addProductController = require('../controllers/addProductController');
const getCategorysController = require('../controllers/getCategorysController');
const profileController = require('../controllers/getPharmacyProfileController');
const editPharmacyProfile = require('../controllers/editPharmacyProfilleController')
const listProducts = require('../controllers/listProductsController')
const getProductInfoController = require('../controllers/getProductInfoController');
const editProductController = require('../controllers/editProductController');
const deleteProductController = require('../controllers/deleteProductController');
const getOrdersController = require('../controllers/getOrdersController');
const acceptOrderController = require('../controllers/acceptOrderController')
const deliveryOrderController = require('../controllers/deliveryOrderController')
const denyOrderController = require('../controllers/denyOrderController')

router.post('/register', registrationController.registerUser);

router.post('/login', loginController.loginUser);

router.post('/add', addProductController.addProduct);

router.get('/categories', getCategorysController.getCategories);

router.get('/info', profileController.getPharmacyProfile);

router.get('/orders', getOrdersController.getOrdersByPharmacy);

router.post('/accept/orders', acceptOrderController.acceptOrder);

router.post('/delivery/orders', deliveryOrderController.deliveryOrder);

router.post('/deny/orders', denyOrderController.denyOrder);

router.put('/edit', editPharmacyProfile.editPharmacyProfile);

router.get('/list/products', listProducts.listProducts);

router.get('/product/:id', getProductInfoController.getProductInfo);

router.put('/edit/product/:id', editProductController.editProduct);

router.delete('/delete/product/:id', deleteProductController.deleteProduct);




module.exports = router;
