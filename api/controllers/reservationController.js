const Availability = require('../models/Availability');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Reservation = require('../models/Reservation');

exports.createReservation = async (req, res) => {
  try {
    const userData = req.user;
    const { place, checkIn, checkOut, numOfGuests, name, phone, price } = req.body;

    console.log('Received request data:', { place, checkIn, checkOut, numOfGuests, name, phone, price });
    const listing_id = Number(place);
    console.log('Converted listing_id:', listing_id, 'Type:', typeof listing_id);

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      console.log('Listing not found for listing_id:', listing_id);
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    const user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    checkInDate.setUTCHours(0, 0, 0, 0);
    checkOutDate.setUTCHours(0, 0, 0, 0);
    console.log('Processed check-in date:', checkInDate, 'Processed check-out date:', checkOutDate);

    const availabilities = await Availability.find({
      listing_id,
      date: { $gte: checkInDate, $lte: checkOutDate },
      is_available: true,
    });
    console.log('Found availabilities:', availabilities.map(a => ({ date: a.date, is_available: a.is_available })));

    const daysDiff = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) + 1;
    console.log('Expected days:', daysDiff, 'Available days:', availabilities.length);

    if (availabilities.length !== daysDiff) {
      return res.status(400).json({
        message: 'Requested dates are not fully available',
      });
    }

    await Availability.updateMany(
      { listing_id, date: { $gte: checkInDate, $lte: checkOutDate } },
      { $set: { is_available: false } }
    );

    const reservation = await Reservation.create({
      listing_id,
      user_id: userData.user_id,
      check_in: checkInDate,
      check_out: checkOutDate,
      num_of_guests: numOfGuests || 1,
      name,
      phone,
      total_price: price,
    });

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
    });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const userData = req.user;
    if (!userData) {
      return res.status(401).json({
        message: 'You are not authorized to access this page',
      });
    }

    const reservations = await Reservation.find({ user_id: userData.user_id }).populate('listing_id');
    res.status(200).json({
      reservations,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};