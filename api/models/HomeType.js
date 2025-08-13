const mongoose = require('mongoose');

const subtypeSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // ID tự động cho subtype
  name: { type: String, required: true }, // Tên subtype
  description: { type: String }, // Mô tả subtype (tùy chọn)
  image: { type: String }, // URL hoặc đường dẫn hình ảnh đại diện
  createdAt: { type: Date, default: Date.now }, // Thời gian tạo subtype
});

const homeTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tên loại nhà (parent category)
  description: { type: String }, // Mô tả loại nhà (tùy chọn)
  subtypes: [subtypeSchema], // Mảng chứa các subtype
  createdAt: { type: Date, default: Date.now }, // Thời gian tạo parent category
});

const HomeType = mongoose.model('HomeType', homeTypeSchema);

module.exports = HomeType;