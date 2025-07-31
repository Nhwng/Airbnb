const mongoose = require('mongoose');

const homeTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tên loại nhà
  description: { type: String }, // Mô tả loại nhà (tùy chọn)
  image: { type: String }, // URL hoặc đường dẫn hình ảnh đại diện
  created_at: { type: Date, default: Date.now }, // Thời gian tạo
});

const HomeType = mongoose.model('HomeType', homeTypeSchema);

module.exports = HomeType;