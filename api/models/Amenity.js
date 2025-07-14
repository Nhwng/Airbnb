const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  listing_id: {
    type: Number,
    ref: 'Listing',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  is_available: {
    type: Boolean,
    default: true,
  },
});

// Compound index to enforce uniqueness on listing_id and title
amenitySchema.index({ listing_id: 1, title: 1 }, { unique: true });

const Amenity = mongoose.model('Amenity', amenitySchema);

module.exports = Amenity;