const Review = require('../models/Review');
const Listing = require('../models/Listing');

// Add a review for a listing
exports.addReview = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, rating, comments } = req.body;

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    const review = await Review.create({
      review_id: Math.floor(100000 + Math.random() * 900000),
      listing_id,
      reviewer_id: userData.user_id,
      rating,
      comments,
    });

    res.status(200).json({
      review,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Get reviews for a listing
exports.getReviews = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const reviews = await Review.find({ listing_id }).populate('reviewer_id');
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

