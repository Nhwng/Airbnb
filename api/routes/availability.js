const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  addAvailability,
  getAvailability,
  updateAvailability,
} = require('../controllers/availabilityController');

router.route('/:listing_id').get(getAvailability);
router.route('/').post(isLoggedIn, addAvailability);
router.route('/update').put(isLoggedIn, updateAvailability);

module.exports = router;