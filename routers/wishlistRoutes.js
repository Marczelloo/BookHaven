const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, wishlistController.addToWishlist);

router.post('/update', authMiddleware, wishlistController.getWishlist);

router.post('/remove', authMiddleware, wishlistController.removeFromWishlist);

router.post('/clear', authMiddleware, wishlistController.clearWishlist);

router.post('/addToCart', authMiddleware, wishlistController.addToCart);

module.exports = router;