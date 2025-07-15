const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  createReservation,
  getReservations,
} = require('../controllers/reservationController');

router.route('/').get(isLoggedIn, getReservations).post(isLoggedIn, createReservation);

module.exports = router;