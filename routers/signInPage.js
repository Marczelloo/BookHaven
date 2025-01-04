const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
   res.render('signInPage', { title: 'Login' });
});

module.exports = router;