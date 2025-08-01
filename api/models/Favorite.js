const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    ref: 'User'
  },
  listing_id: {
    type: Number,
    required: true,
    ref: 'Listing'
  }
}, { 
  timestamps: true,
  // Ensure a user can only favorite a listing once
  indexes: [{ user_id: 1, listing_id: 1 }, { unique: true }]
});

// Compound index to prevent duplicate favorites
favoriteSchema.index({ user_id: 1, listing_id: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;