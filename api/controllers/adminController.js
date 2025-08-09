const User = require('../models/User');

// Lấy danh sách user có yêu cầu làm host (hostRequestStatus = 'pending')
exports.getHostRequests = async (req, res) => {
  try {
    const users = await User.find({ role: 'guest', hostRequestStatus: 'pending' }).select('-password -emailVerificationPin');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};
