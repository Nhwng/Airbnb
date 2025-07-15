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
    const images = await Image.find({ listing_id });
    res.status(200).json(images);
  } catch (err) {
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