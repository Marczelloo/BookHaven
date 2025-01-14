const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', userController.signup);

router.post('/signin', userController.signin);

router.get('/signout', userController.signout);

router.post('/update', authMiddleware, userController.updateProfile);

module.exports = router;