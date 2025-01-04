const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
   res.render('signUpPage', { title: 'Sign Up' });
});

module.exports = router;