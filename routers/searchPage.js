const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
   res.render('searchPage', { title: 'Search' });
});

module.exports = router;