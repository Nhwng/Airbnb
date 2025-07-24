const Availability = require('../models/Availability');
const Listing = require('../models/Listing');

// Add availability for a listing
exports.addAvailability = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, date, is_available, price, min_nights } = req.body;

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'Unauthorized to add availability to this listing',
      });
    }

    const availability = await Availability.create({
      listing_id,
      date,
      is_available,
      price,
      min_nights,
    });

    res.status(200).json({
      availability,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Get availability for a listing
exports.getAvailability = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const availabilities = await Availability.find({ listing_id: Number(listing_id) });
    res.status(200).json(availabilities);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Update availability
exports.updateAvailability = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, date, is_available, price, min_nights } = req.body;

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'Unauthorized to update availability for this listing',
      });
    }

    const availability = await Availability.findOneAndUpdate(
      { listing_id, date },
      { is_available, price, min_nights },
      { new: true }
    );

    if (!availability) {
      return res.status(404).json({
        message: 'Availability not found',
      });
    }

    res.status(200).json({
      message: 'Availability updated successfully',
      availability,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};