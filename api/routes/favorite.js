const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Listing = require('../models/Listing');
const { isLoggedIn } = require('../middlewares/user');

// Get user's favorite listings with pagination and images
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const { user_id } = req.user;
    
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const includeImages = req.query.include_images === 'true';

    // Get total count for pagination
    const totalCount = await Favorite.countDocuments({ user_id });
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get favorites with pagination
    const favorites = await Favorite.find({ user_id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get listing IDs from favorites
    const listingIds = favorites.map(fav => fav.listing_id);
    
    // Fetch listings separately
    const listings = await Listing.find({ listing_id: { $in: listingIds } });
    
    // If images requested, fetch them in single batch query
    let imagesByListing = {};
    if (includeImages && listingIds.length > 0) {
      const Image = require('../models/Image');
      const images = await Image.find({ 
        listing_id: { $in: listingIds } 
      }).select('listing_id url');
      
      // Group images by listing_id
      imagesByListing = images.reduce((acc, img) => {
        if (!acc[img.listing_id]) acc[img.listing_id] = [];
        acc[img.listing_id].push(img.url);
        return acc;
      }, {});
    }
    
    // Map listings to favorites
    const favoritesWithListings = favorites.map(favorite => {
      const listing = listings.find(l => l.listing_id === favorite.listing_id);
      if (!listing) return null;
      
      return {
        ...favorite.toObject(),
        listing_id: listing,
        listing_images: imagesByListing[favorite.listing_id] || []
      };
    }).filter(Boolean); // Filter out favorites where listing was deleted
    
    res.status(200).json({
      success: true,
      count: favoritesWithListings.length,
      favorites: favoritesWithListings,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites'
    });
  }
});

// Add a listing to favorites
router.post('/:listingId', isLoggedIn, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { listingId } = req.params;
    
    console.log(`🔥 POST /favorites/${listingId} - User: ${user_id}`);
    
    // Handle large numbers that exceed JavaScript's safe integer limit
    let listingIdNum;
    try {
      listingIdNum = Number(listingId);
      // Check if the number conversion lost precision for very large numbers
      if (listingId.length > 15 && !Number.isSafeInteger(listingIdNum)) {
        listingIdNum = parseFloat(listingId);
      }
    } catch (error) {
      console.log(`❌ Number conversion error for ${listingId}:`, error.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format'
      });
    }
    
    console.log(`🔍 Looking for listing with ID: ${listingIdNum} (original: ${listingId})`);
    // Check if listing exists
    const listing = await Listing.findOne({ listing_id: listingIdNum });
    console.log(`📄 Found listing for favorites:`, !!listing);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user_id,
      listing_id: listingIdNum
    });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Listing already in favorites'
      });
    }
    
    // Create favorite
    const favorite = await Favorite.create({
      user_id,
      listing_id: listingIdNum
    });
    
    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Listing already in favorites'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites'
    });
  }
});

// Remove a listing from favorites
router.delete('/:listingId', isLoggedIn, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { listingId } = req.params;
    
    // Handle large numbers that exceed JavaScript's safe integer limit
    let listingIdNum;
    try {
      listingIdNum = Number(listingId);
      if (listingId.length > 15 && !Number.isSafeInteger(listingIdNum)) {
        listingIdNum = parseFloat(listingId);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format'
      });
    }
    
    const favorite = await Favorite.findOneAndDelete({
      user_id,
      listing_id: listingIdNum
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
});

// Check if a listing is favorited by user
router.get('/check/:listingId', isLoggedIn, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { listingId } = req.params;
    
    // Handle large numbers that exceed JavaScript's safe integer limit
    let listingIdNum;
    try {
      listingIdNum = Number(listingId);
      if (listingId.length > 15 && !Number.isSafeInteger(listingIdNum)) {
        listingIdNum = parseFloat(listingId);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format'
      });
    }
    
    const favorite = await Favorite.findOne({
      user_id,
      listing_id: listingIdNum
    });
    
    res.status(200).json({
      success: true,
      isFavorited: !!favorite
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status'
    });
  }
});

module.exports = router;