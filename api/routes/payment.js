const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  createPayment,
  handleZaloPayCallback,
  getPayment,
  getUserPayments,
  refreshPayment,
} = require('../controllers/paymentController');

router.route('/')
  .get(isLoggedIn, getUserPayments)
  .post(isLoggedIn, createPayment);

router.route('/:paymentId')
  .get(isLoggedIn, getPayment);

router.route('/:paymentId/refresh')
  .post(isLoggedIn, refreshPayment);

router.post('/zalopay/callback', handleZaloPayCallback);

module.exports = router;