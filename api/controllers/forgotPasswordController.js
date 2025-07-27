const User = require('../models/User');
const nodemailer = require('nodemailer');

function generateRandomPassword(length = 10) {
  let result = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const newPassword = generateRandomPassword();
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Gửi email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Mật khẩu mới cho tài khoản Airbnb',
      text: `Mật khẩu mới của bạn là: ${newPassword}`,
    });

    res.json({ message: 'Mật khẩu mới đã được gửi tới email của bạn.' });
  } catch (err) {
    res.status(500).json({ message: 'Có lỗi xảy ra.', error: err.message });
  }
};
