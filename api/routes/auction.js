const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  requestAuction,
  getHostAuctionRequests,
  getPendingAuctionRequests,
  updateAuctionRequestStatus,
  getActiveAuctions,
  placeBid,
  getAuctionDetails
} = require('../controllers/auctionController');

// Host routes (require authentication)
router.route('/request').post(isLoggedIn, requestAuction);
router.route('/host/requests').get(isLoggedIn, getHostAuctionRequests);

// Admin routes (require authentication + admin role check is in controller)
router.route('/admin/pending').get(isLoggedIn, getPendingAuctionRequests);
router.route('/admin/request/:requestId').put(isLoggedIn, updateAuctionRequestStatus);

// Public routes for viewing auctions
router.route('/active').get(getActiveAuctions);
router.route('/:auctionId').get(getAuctionDetails);

// User bidding routes (require authentication)
router.route('/:auctionId/bid').post(isLoggedIn, placeBid);

module.exports = router;