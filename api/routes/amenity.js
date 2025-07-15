const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  addAmenity,
  getAmenities,
  updateAmenity,
} = require('../controllers/amenityController');

router.route('/:listing_id').get(getAmenities);
router.route('/').post(isLoggedIn, addAmenity);
router.route('/update').put(isLoggedIn, updateAmenity);

module.exports = router;