const mongoose = require('mongoose');

const auctionRequestSchema = new mongoose.Schema({
  listing_id: {
    type: Number,
    required: true,
    ref: 'Listing'
  },
  host_id: {
    type: Number,
    required: true,
    ref: 'User'
  },
  starting_price: {
    type: Number,
    required: true,
    min: 0
  },
  buyout_price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  admin_notes: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  approved_at: {
    type: Date
  },
  approved_by: {
    type: Number,
    ref: 'User'
  }
});

// Index for efficient queries
auctionRequestSchema.index({ listing_id: 1 });
auctionRequestSchema.index({ host_id: 1 });
auctionRequestSchema.index({ status: 1 });

const AuctionRequest = mongoose.model('AuctionRequest', auctionRequestSchema);

module.exports = AuctionRequest;