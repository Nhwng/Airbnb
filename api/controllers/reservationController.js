const Availability = require('../models/Availability');
const Listing = require('../models/Listing');
const User = require('../models/User');

// Creates a reservation by updating availability
exports.createReservation = async (req, res) => {
  try {
    const userData = req.user;
    const { listing_id, checkIn, checkOut, numOfGuests, name, phone } = req.body;

    // Validate listing exists
    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    // Validate user exists
    const user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Check availability for the requested dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const availabilities = await Availability.find({
      listing_id,
      date: { $gte: checkInDate, $lte: checkOutDate },
      is_available: true,
    });

    if (availabilities.length !== (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24) + 1) {
      return res.status(400).json({
        message: 'Requested dates are not fully available',
      });
    }

    // Calculate total price
    const totalPrice = availabilities.reduce((sum, avail) => sum + (avail.price || listing.price_per_night), 0);

    // Update availability to mark as reserved
    await Availability.updateMany(
      { listing_id, date: { $gte: checkInDate, $lte: checkOutDate } },
      { $set: { is_available: false } }
    );

    // Note: Since there's no Booking model, we return reservation details without storing a separate booking
    res.status(200).json({
      reservation: {
        listing_id,
        user_id: userData.user_id,
        check_in: checkInDate,
        check_out: checkOutDate,
        num_of_guests: numOfGuests,
        name,
        phone,
        total_price: totalPrice,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Returns user-specific reservations (based on Availability changes)
exports.getReservations = async (req, res) => {
  try {
    const userData = req.user;
    if (!userData) {
      return res.status(401).json({
        message: 'You are not authorized to access this page',
      });
    }

    // Since there's no Booking model, we can't directly query reservations.
    // Instead, we could track reservations by checking Availability updates or logs,
    // but for simplicity, we'll return a placeholder response.
    // In a real app, you might need a separate collection or log to track reservations.
    res.status(200).json({
      message: 'Reservations not directly stored. Please implement a Booking model for full functionality.',
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};