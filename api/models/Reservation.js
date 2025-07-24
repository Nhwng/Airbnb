const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  listing_id: { type: Number, ref: 'Listing', required: true },
  user_id: { type: Number, ref: 'User', required: true },
  check_in: { type: Date, required: true },
  check_out: { type: Date, required: true },
  num_of_guests: { type: Number, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  total_price: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;