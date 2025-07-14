const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  listing_id: {
    type: Number,
    ref: 'Listing',
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
  },
});

// Compound index to enforce uniqueness on listing_id and url
imageSchema.index({ listing_id: 1, url: 1 }, { unique: true });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;