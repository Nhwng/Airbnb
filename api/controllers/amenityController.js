const Amenity = require('../models/Amenity');
const Listing = require('../models/Listing');

// Add an amenity to a listing
exports.addAmenity = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, title, is_available } = req.body;

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'Unauthorized to add amenities to this listing',
      });
    }

    const amenity = await Amenity.create({
      listing_id,
      title,
      is_available,
    });

    res.status(200).json({
      amenity,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Get amenities for a listing
exports.getAmenities = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const amenities = await Amenity.find({ listing_id });
    res.status(200).json(amenities);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Update an amenity
exports.updateAmenity = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, title, is_available } = req.body;

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'Unauthorized to update amenities for this listing',
      });
    }

    const amenity = await Amenity.findOneAndUpdate(
      { listing_id, title },
      { is_available },
      { new: true }
    );

    if (!amenity) {
      return res.status(404).json({
        message: 'Amenity not found',
      });
    }

    res.status(200).json({
      message: 'Amenity updated successfully',
      amenity,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};