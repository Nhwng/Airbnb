const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  createReservation,
  getReservations,
  updateReservationStatus,
} = require('../controllers/reservationController');

router.route('/').get(isLoggedIn, getReservations).post(isLoggedIn, createReservation);
router.route('/:id/status').put(isLoggedIn, updateReservationStatus);
module.exports = router;