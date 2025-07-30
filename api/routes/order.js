const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  createOrder,
  getOrder,
  getUserOrders,
  cancelOrder,
} = require('../controllers/orderController');

router.route('/')
  .get(isLoggedIn, getUserOrders)
  .post(isLoggedIn, createOrder);

router.route('/:orderId')
  .get(isLoggedIn, getOrder)
  .delete(isLoggedIn, cancelOrder);

module.exports = router;