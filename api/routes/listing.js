const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  addListing,
  getListings,
  updateListing,
  singleListing,
  userListings,
  searchListings,
  triggerDataSync,
  getCatalog,
} = require('../controllers/listingController');

router.route('/').get(getListings);
router.route('/catalog').get(getCatalog);
// Protected routes (user must be logged in)
router.route('/add').post(isLoggedIn, addListing);
router.route('/user-listings').get(isLoggedIn, userListings);
router.route('/update').put(isLoggedIn, updateListing);
router.route('/sync-data').post(isLoggedIn, triggerDataSync);
// Not protected routes
router.route('/:id').get(singleListing);
router.route('/search/:key').get(searchListings);
module.exports = router;