const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
   res.render('bookPage', { title: 'Book Page' });
});

module.exports = router;