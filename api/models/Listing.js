const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  listing_id: {
    type: Number,
    required: true,
    unique: true,
  },
  host_id: {
    type: Number,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  photos: {
    type: [String],
  },
  description: {
    type: String,
  },
  amenities: {
    type: [String],
  },
  extra_info: {
    type: String,
  },
  max_guests: {
    type: Number,
  },
  price_per_night: {
    type: Number,
  },
}, { timestamps: true });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;