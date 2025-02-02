const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/', searchController.getSearchPage);

router.post('/', searchController.getSearchSuggestions);

router.post('/subcategories', searchController.getSubcategories);

router.post('/results', searchController.getResults);

module.exports = router;