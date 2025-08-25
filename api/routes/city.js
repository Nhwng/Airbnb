const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

// GET /api/cities
router.get('/', cityController.getCities);

module.exports = router;
