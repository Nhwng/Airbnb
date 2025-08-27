const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  requestAuction,
  getHostAuctionRequests,
  getPendingAuctionRequests,
  updateAuctionRequestStatus,
  getActiveAuctions,
  getAllAuctions,
  placeBid,
  getAuctionDetails,
  buyoutAuction,
  processEndedAuctionsEndpoint,
  auctionSSE,
  getSSEStats
} = require('../controllers/auctionController');

// Host routes (require authentication)
router.route('/request').post(isLoggedIn, requestAuction);
router.route('/host/requests').get(isLoggedIn, getHostAuctionRequests);

// Admin routes (require authentication + admin role check is in controller)
router.route('/admin/pending').get(isLoggedIn, getPendingAuctionRequests);
router.route('/admin/request/:requestId').put(isLoggedIn, updateAuctionRequestStatus);

// Public routes for viewing auctions
router.route('/').get(getAllAuctions); // General auction list with filtering/pagination
router.route('/active').get(getActiveAuctions); // Legacy active auctions endpoint
router.route('/:auctionId').get(getAuctionDetails);

// SSE (Server-Sent Events) routes for real-time updates
router.route('/:auctionId/events').get(isLoggedIn, auctionSSE);

// User bidding routes (require authentication)
router.route('/:auctionId/bid').post(isLoggedIn, placeBid);
router.route('/:auctionId/buyout').post(isLoggedIn, buyoutAuction);

// Admin/system routes
router.route('/admin/process-ended').post(isLoggedIn, processEndedAuctionsEndpoint);
router.route('/admin/sse-stats').get(isLoggedIn, getSSEStats);

module.exports = router;