const express = require('express');
const router = express.Router();
const redirectIfAuthenticated = require('../middleware/redirectIfAuthenticated');
const bookController = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');
const wishlistController = require('../controllers/wishlistController');
const attachUser = require('../middleware/attachUser');
const userController = require('../controllers/userController');

router.use(attachUser);

router.get('/', (req, res) => {
   res.render('landingPage', { title: 'Book Haven' });
});

router.get('/explore', bookController.getExplorePage)

router.get('/book/:id', bookController.getBookPage);

router.get('/cart', authMiddleware, cartController.getCart);

router.get('/wishlist', authMiddleware, wishlistController.getWishlist);

router.get('/signin', redirectIfAuthenticated, (req, res) => {
   const { message } = req.query;
   res.render('signInPage', { title: 'Sign In', notificationMessage: message });
});

router.get('/signup', redirectIfAuthenticated, (req, res) => {   
   res.render('signUpPage', { title: 'Sign Up' });
});

router.get('/profile', authMiddleware, userController.getProfile);

module.exports = router;