// routes/statistics.js
const express = require('express');
const router = express.Router();
const stats = require('../controllers/statisticsController');

// Các route thống kê – tự check quyền admin trong controller
router.get('/overview', stats.getOverview);
router.get('/revenue-series', stats.getRevenueSeries);
router.get('/top-listings', stats.getTopListings);
router.get('/customers', stats.getTopCustomers);
router.get('/catalog', stats.getCatalogStats);

module.exports = router;
