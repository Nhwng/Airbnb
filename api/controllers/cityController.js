const City = require('../models/City');

// GET /api/cities - Lấy danh sách thành phố
exports.getCities = async (req, res) => {
  try {
    const cities = await City.find({}, 'name'); // chỉ lấy tên thành phố
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách thành phố' });
  }
};
