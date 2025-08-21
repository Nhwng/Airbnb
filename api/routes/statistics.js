// routes/statistics.js
const express = require('express');
const router = express.Router();
const stats = require('../controllers/statisticsController');
const {isAdmin} = require('../middlewares/admin');

// Các route thống kê – tự check quyền admin trong controller
router.get('/overview', isAdmin, stats.getOverview);
router.get('/revenue-series', isAdmin, stats.getRevenueSeries);
router.get('/top-listings', isAdmin, stats.getTopListings);
router.get('/customers', isAdmin, stats.getTopCustomers);
router.get('/catalog', isAdmin, stats.getCatalogStats);

module.exports = router;
