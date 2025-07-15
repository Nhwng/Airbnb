const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review_id: {
    type: String,
    required: true,
    unique: true,
  },
  listing_id: {
    type: Number,
    ref: 'Listing',
    required: true,
  },
  reviewer_id: {
    type: Number,
    ref: 'User',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  comments: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },

}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;