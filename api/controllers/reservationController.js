const Availability = require('../models/Availability');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Reservation = require('../models/Reservation');

exports.createReservation = async (req, res) => {
  try {
    const userData = req.user;
    const { place, checkIn, checkOut, numOfGuests, name, phone, price } = req.body;

    const listing_id = Number(place);

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
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

    const availabilities = await Availability.find({
      listing_id,
      date: { $gte: checkInDate, $lte: checkOutDate },
      is_available: true,
    });

    const daysDiff = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) + 1;

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
    const { user_id, role } = req.user;
    const query = {};

    // Nếu không phải admin thì chỉ lấy của user đó
    if (role !== 'admin') {
      query.user_id = user_id;
    }

    // Bắt đầu build query
    let q = Reservation.find(query)
      .sort({ created_at: -1 });

    if (role === 'admin') {
      // Admin: populate thêm title của listing và name của user
      q = q
        .populate({
          path: 'listing_id',          // tên field trong Reservation
          model: 'Listing',            // model đích
          localField: 'listing_id',    // field trong Reservation
          foreignField: 'listing_id',  // field trong Listing
          justOne: true,
          select: 'title'
        })
        .populate({
          path: 'user_id',
          model: 'User',
          localField: 'user_id',
          foreignField: 'user_id',
          justOne: true,
          select: 'first_name last_name'
        });
    } else {
      // User thường: chỉ cần các trường cơ bản
      q = q.select(
        'listing_id check_in check_out num_of_guests total_price status created_at'
      );
    }

    const reservations = await q.exec();
    return res.status(200).json({ reservations });
  } catch (err) {
    console.error('Error fetching reservations:', err);
    return res.status(500).json({
      message: 'Error fetching reservations',
      error: err.message
    });
  }
};
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1) Check role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // 2) Validate status
    if (!['confirmed','cancelled','completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // 3) Find & update
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    reservation.status = status;
    await reservation.save();

    return res.status(200).json({ reservation });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};