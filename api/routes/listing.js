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
  createHomeType,
  addSubtype,
  deleteHomeType,
  deleteListing,
  deleteSubtype
  // Thêm deleteSubtype nếu triển khai
} = require('../controllers/listingController');

router.route('/').get(getListings);
router.route('/catalog').get(getCatalog);
router.route('/homepage-listings').get(getListings); // Homepage listings endpoint
router.route('/search').get(searchListings); // Advanced search endpoint
// Protected routes (user must be logged in)
router.route('/add').post(isLoggedIn, addListing);
router.route('/user-listings').get(isLoggedIn, userListings);
router.route('/update').put(isLoggedIn, updateListing);
router.route('/sync-data').post(isLoggedIn, triggerDataSync);
// Admin-only routes
router.route('/hometypes').post(isLoggedIn, createHomeType);
router.route('/hometypes/:id/subtypes').post(isLoggedIn, addSubtype);
router.route('/hometypes/:id').delete(isLoggedIn, deleteHomeType);

router.route('/:id').get(singleListing).delete(isLoggedIn, deleteListing); // Thêm delete cho listing
router.route('/search/:key').get(searchListings);
router.route('/hometypes/:id/subtypes/:subId').delete(isLoggedIn, deleteSubtype);
module.exports = router;