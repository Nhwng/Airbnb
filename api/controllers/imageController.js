const Image = require('../models/Image');
const Listing = require('../models/Listing');

// Add an image to a listing
exports.addImage = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, url, caption } = req.body;

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'Unauthorized to add images to this listing',
      });
    }

    const image = await Image.create({
      listing_id,
      url,
      caption,
    });

    res.status(200).json({
      image,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Get images for a listing
exports.getImages = async (req, res) => {
  try {
    const { listing_id } = req.params;
    
    // Handle large numbers that exceed JavaScript's safe integer limit
    let numericId;
    try {
      // Try to parse as regular number first
      numericId = Number(listing_id);
      
      // Check if the number conversion lost precision
      if (listing_id.length > 15 && !Number.isSafeInteger(numericId)) {
        // For very large numbers, try direct string-to-number conversion
        // MongoDB can handle these large numbers correctly
        numericId = parseFloat(listing_id);
      }
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid listing ID format',
      });
    }
    
    if (isNaN(numericId)) {
      return res.status(400).json({
        message: 'Invalid listing ID format',
      });
    }
    
    console.log(`🔍 Looking for images with listing_id: ${numericId} (original: ${listing_id})`);
    
    // Try multiple approaches to find images due to precision issues with large numbers
    let images = await Image.find({ listing_id: numericId });
    
    if (images.length === 0) {
      // If no exact match, try finding images within a small range (due to precision loss)
      const tolerance = 10; // Allow small differences due to floating point precision
      images = await Image.find({ 
        listing_id: { 
          $gte: numericId - tolerance, 
          $lte: numericId + tolerance 
        } 
      });
      console.log(`📸 Range search found ${images.length} images for listing ${numericId}`);
    }
    
    console.log(`📸 Final result: ${images.length} images for listing ${numericId}`);
    
    res.status(200).json(images);
  } catch (err) {
    console.error('Get images error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Delete an image
exports.deleteImage = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, url } = req.params;

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'Unauthorized to delete images from this listing',
      });
    }

    const image = await Image.findOneAndDelete({ listing_id, url });
    if (!image) {
      return res.status(404).json({
        message: 'Image not found',
      });
    }

    res.status(200).json({
      message: 'Image deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};