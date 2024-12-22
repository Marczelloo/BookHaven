const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
   res.render('landingPage', { title: 'Landing Page' });
})

module.exports = router;