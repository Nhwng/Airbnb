const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  listing_id: { type: Number, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
  currency: { type: String, required: true },
  description: { type: String, required: true },
  host_id: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  nightly_price: { type: Number, required: true },
  person_capacity: { type: Number, required: true },
  room_type: { type: String, required: true },
  title: { type: String, required: true },
});

listingSchema.pre('save', function (next) {
  console.log('Pre-save hook triggered with data:', this.toObject()); // Debug
  next();
});

listingSchema.pre('findOneAndUpdate', function (next) {
  console.log('Pre-findOneAndUpdate hook triggered with data:', this.getUpdate()); // Debug
  next();
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;