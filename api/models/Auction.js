const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
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
  auction_start: {
    type: Date,
    required: true,
    default: function() {
      // Start auction from day 15 (2 weeks from today)
      const start = new Date();
      start.setDate(start.getDate() + 14);
      return start;
    }
  },
  auction_end: {
    type: Date,
    required: true,
    default: function() {
      // End auction 24 hours before accommodation period
      const end = new Date();
      end.setDate(end.getDate() + 30); // 30 days default auction period
      return end;
    }
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
  current_bid: {
    type: Number,
    default: function() { return this.starting_price; }
  },
  highest_bidder: {
    type: Number,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'cancelled'],
    default: 'active'
  },
  total_bids: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field on save
auctionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for efficient queries
auctionSchema.index({ listing_id: 1 });
auctionSchema.index({ status: 1 });
auctionSchema.index({ auction_end: 1 });
auctionSchema.index({ host_id: 1 });

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;