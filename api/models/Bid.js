const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Auction'
  },
  bidder_id: {
    type: Number,
    required: true,
    ref: 'User'
  },
  bid_amount: {
    type: Number,
    required: true,
    min: 0
  },
  bid_time: {
    type: Date,
    default: Date.now
  },
  is_winning: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'outbid', 'winning', 'lost'],
    default: 'active'
  }
});

// Index for efficient queries
bidSchema.index({ auction_id: 1 });
bidSchema.index({ bidder_id: 1 });
bidSchema.index({ bid_time: -1 });
bidSchema.index({ auction_id: 1, bid_amount: -1 });

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;