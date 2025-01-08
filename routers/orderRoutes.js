const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/place', authMiddleware, orderController.placeOrder);

router.post('/get', authMiddleware, orderController.getOrders);

module.exports = router;
