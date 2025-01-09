const express = require('express');
const router = express.Router();
const redirectIfAuthenticated = require('../middleware/redirectIfAuthenticated');
const bookController = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');
wishlistController = require('../controllers/wishlistController');

router.get('/', (req, res) => {
   res.render('landingPage', { title: 'Book Haven' });
});

router.get('/explore', bookController.getExplorePage)

router.get('/book/:id', bookController.getBookPage);

router.get('/search', (req, res) => {
   res.render('searchPage', { title: 'Search' });
});

router.get('/cart', authMiddleware, cartController.getCart);

router.get('/wishlist', authMiddleware, wishlistController.getWishlist);

router.get('/signin', redirectIfAuthenticated, (req, res) => {
   res.render('signInPage', { title: 'Sign In' });
});

router.get('/signup', redirectIfAuthenticated, (req, res) => {   
   res.render('signUpPage', { title: 'Sign Up' });
});

module.exports = router;