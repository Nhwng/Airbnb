const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  addReview,
  getReviews,
  respondToReview,
} = require('../controllers/reviewController');

router.route('/:listing_id').get(getReviews);
router.route('/').post(isLoggedIn, addReview);

module.exports = router;