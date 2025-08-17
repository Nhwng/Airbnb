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
    min: 0,
    validate: {
      validator: function(price) {
        return price > this.starting_price;
      },
      message: 'Buyout price must be higher than starting price'
    }
  },
  check_in_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 21); // 21 days minimum (14 auction + 7 buffer)
        return date >= minDate;
      },
      message: 'Check-in date must be at least 21 days from today'
    }
  },
  check_out_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > this.check_in_date;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  auction_duration_days: {
    type: Number,
    required: true,
    enum: [7, 14, 21, 30],
    default: 14
  },
  auction_start_date: {
    type: Date,
    required: true
  },
  auction_end_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        // Auction must end at least 7 days before check-in
        const bufferDate = new Date(this.check_in_date);
        bufferDate.setDate(bufferDate.getDate() - 7);
        return date <= bufferDate;
      },
      message: 'Auction must end at least 7 days before check-in date'
    }
  },
  total_nights: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(nights) {
        // Calculate nights from dates
        if (this.check_in_date && this.check_out_date) {
          const diffTime = this.check_out_date - this.check_in_date;
          const calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return nights === calculatedNights;
        }
        return nights > 0;
      },
      message: 'Total nights must match the difference between check-in and check-out dates'
    }
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