const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tên thành phố
  coordinates: {
    ne_lat: { type: Number, required: true },
    ne_long: { type: Number, required: true },
    sw_lat: { type: Number, required: true },
    sw_long: { type: Number, required: true },
  },
  image: { type: String }, // URL hoặc đường dẫn hình ảnh đại diện
  created_at: { type: Date, default: Date.now }, // Thời gian tạo
});

const City = mongoose.model('City', citySchema);

module.exports = City;