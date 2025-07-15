const Listing = require('../models/Listing');

// Adds a listing in the DB
exports.addListing = async (req, res) => {
  try {
    const userData = req.user;
    const {
      title,
      address,
      addedPhotos,
      description,
      perks,
      extraInfo,
      maxGuests,
      price,
    } = req.body;

    const listing = await Listing.create({
      host_id: userData.user_id,
      listing_id: Math.floor(100000 + Math.random() * 900000),
      title,
      address,
      photos: addedPhotos,
      description,
      amenities: perks,
      extra_info: extraInfo,
      max_guests: maxGuests,
      price_per_night: price,
    });

    res.status(200).json({
      listing,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Returns user-specific listings
exports.userListings = async (req, res) => {
  try {
    const userData = req.user;
    const listings = await Listing.find({ host_id: userData.user_id });
    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Updates a listing
exports.updateListing = async (req, res) => {
  try {
    const userData = req.user;
    const {
      id,
      title,
      address,
      addedPhotos,
      description,
      perks,
      extraInfo,
      maxGuests,
      price,
    } = req.body;

    const listing = await Listing.findOne({ listing_id: id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'Unauthorized to update this listing',
      });
    }

    listing.set({
      title,
      address,
      photos: addedPhotos,
      description,
      amenities: perks,
      extra_info: extraInfo,
      max_guests: maxGuests,
      price_per_night: price,
    });

    await listing.save();
    res.status(200).json({
      message: 'Listing updated successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Returns all listings in DB
exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find();
    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Returns single listing based on listing_id
exports.singleListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findOne({ listing_id: id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }
    res.status(200).json(listing);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Search listings in the DB
exports.searchListings = async (req, res) => {
  try {
    const { key } = req.params;
    let searchMatches;
    if (!key) {
      searchMatches = await Listing.find();
    } else {
      searchMatches = await Listing.find({ address: { $regex: key, $options: 'i' } });
    }
    res.status(200).json(searchMatches);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};