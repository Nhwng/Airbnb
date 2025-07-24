const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  listing_id: {
    type: Number,
    ref: 'Listing',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  is_available: {
    type: Boolean,
    required: true,
  },
  price: {
    type: Number,
  },
  min_nights: {
    type: Number,
    default: 1,
  },
}, { _id: false });

// Compound index to enforce uniqueness on listing_id and date
availabilitySchema.index({ listing_id: 1, date: 1 }, { unique: true });
const Availability = mongoose.model('Availability', availabilitySchema, 'availability');

module.exports = Availability;