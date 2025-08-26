const User = require('../models/User');
const cookieToken = require('../utils/cookieToken');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const { sendVerificationEmail } = require('../utils/email');

// Register/SignUp user
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, picture_url } = req.body;

    if (!first_name || !email || !password || !role) {
      return res.status(400).json({
        message: 'First name, email, password, and role are required',
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: 'User already registered',
      });
    }

    // Tạo mã PIN xác thực 6 số
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    user = await User.create({
      user_id: Math.floor(100000 + Math.random() * 900000),
      first_name,
      last_name,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      picture_url: picture_url || '',
      emailVerified: false,
      emailVerificationPin: pin,
      emailVerificationPinCreatedAt: new Date(),
    });

    // Gửi email xác thực
    try {
      await sendVerificationEmail(email, pin);
    } catch (e) {
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ message: 'Gửi email xác thực thất bại.' });
    }

    res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      userId: user._id,
      email,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Login/SignIn user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({
        message: 'User does not exist',
      });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Tài khoản chưa được xác thực email. Vui lòng kiểm tra email để xác thực.',
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Email or password is incorrect',
      });
    }

    cookieToken(user, res);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Facebook Login
const axios = require('axios');
exports.facebookLogin = async (req, res) => {
  const { access_token } = req.body;
  console.log('[FacebookLogin] access_token:', access_token);
  if (!access_token) {
    console.error('[FacebookLogin] Missing access_token');
    return res.status(400).json({ message: 'Access token is required' });
  }
  try {
    const fbRes = await axios.get(`https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${access_token}`);
    const { id, first_name, last_name, email, picture } = fbRes.data;
    if (!email) {
      console.error('[FacebookLogin] Facebook account does not have email:', fbRes.data);
      return res.status(400).json({ message: 'Facebook account must have an email' });
    }
    let user = await User.findOne({ email });
    if (!user) {
      // Nếu chưa có user thì tạo mới
      // Tạo password ngẫu nhiên cho user Facebook
      const randomPassword = Math.random().toString(36).slice(-8);
      user = await User.create({
        user_id: Math.floor(100000 + Math.random() * 900000),
        first_name,
        last_name,
        email,
        password: randomPassword,
        role: 'guest',
        picture_url: picture?.data?.url || ''
      });
    } else {
      console.log('[FacebookLogin] Found existing user:', user);
    }
    // Tạo JWT token và trả về
    cookieToken(user, res);
  } catch (err) {
    console.error('[FacebookLogin] Error:', err);
    res.status(400).json({ message: 'Facebook login failed', error: err.message });
  }
};

// Upload picture
exports.uploadPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const userData = req.user;

    const { path } = req.file;

    const result = await cloudinary.uploader.upload(path, {
      folder: 'Airbnb/Users',
    });
    

    const user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    user.picture_url = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      picture_url: result.secure_url,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: err.message,
    });
  }
};

// Update user
exports.updateUserDetails = async (req, res) => {
  try {
    const userData = req.user;
    const { first_name, last_name, password, picture_url } = req.body;

    const user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (picture_url) user.picture_url = picture_url;
    if (password) user.password = await bcrypt.hash(password, 10);

    const updatedUser = await user.save();
    // Set cookie nhưng không gửi response ở đây
    const token = updatedUser.getJwtToken();
    const options = {
      expires: new Date(Date.now() + process.env.COOKIE_TIME * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };
    updatedUser.password = undefined;
    res.cookie('token', token, options);
    return res.status(200).json({
      success: true,
      user: updatedUser,
      token,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
      stack: err.stack,
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.status(200).json({
    success: true,
    message: 'Logged out',
  });
};

// Gửi lại mã PIN xác thực email
exports.resendEmailPin = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Thiếu email.' });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Không tìm thấy người dùng.' });
  if (user.emailVerified) return res.status(400).json({ message: 'Tài khoản đã xác thực.' });
  // Tạo mã PIN mới
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationPin = pin;
  user.emailVerificationPinCreatedAt = new Date();
  await user.save();
  try {
    await require('../utils/email').sendVerificationEmail(email, pin);
  } catch (e) {
    return res.status(500).json({ message: 'Gửi email thất bại.' });
  }
  res.json({ message: 'Đã gửi lại mã xác thực.' });
};
// Xác thực mã PIN email
exports.verifyEmailPin = async (req, res) => {
  const { email, pin } = req.body;
  if (!email || !pin) {
    return res.status(400).json({ message: 'Thiếu email hoặc mã PIN.' });
  }
  const user = await User.findOne({ email }).select('+emailVerificationPin +emailVerificationPinCreatedAt');
  if (!user) {
    return res.status(400).json({ message: 'Không tìm thấy người dùng.' });
  }
  if (user.emailVerified) {
    return res.status(400).json({ message: 'Tài khoản đã được xác thực.' });
  }
  // Kiểm tra hết hạn mã PIN (5 phút)
  const now = new Date();
  const createdAt = user.emailVerificationPinCreatedAt;
  if (!createdAt || (now - createdAt) > 5 * 60 * 1000) {
    return res.status(400).json({ message: 'Mã PIN đã hết hạn. Vui lòng gửi lại mã mới.' });
  }
  if (user.emailVerificationPin !== pin) {
    return res.status(400).json({ message: 'Mã PIN không đúng.' });
  }
  user.emailVerified = true;
  user.emailVerificationPin = undefined;
  user.emailVerificationPinCreatedAt = undefined;
  await user.save();
  // Đăng nhập tự động sau xác thực
  const token = user.getJwtToken();
  res.cookie('token', token, { httpOnly: true });
  res.json({ message: 'Xác thực thành công.', token });
};

// Admin duyệt hoặc từ chối yêu cầu làm host
exports.handleHostRequest = async (req, res) => {
  try {
    const { userId, action } = req.body; // userId: id của user cần duyệt, action: 'approve' hoặc 'reject'
    if (!userId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc action không hợp lệ.' });
    }
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
    }
    if (user.role !== 'guest' || user.hostRequestStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ.' });
    }
    if (action === 'approve') {
      user.hostRequestStatus = 'approved';
      user.role = 'host';
    } else {
      user.hostRequestStatus = 'rejected';
    }
    await user.save();
    return res.status(200).json({ success: true, message: `Yêu cầu đã được ${action === 'approve' ? 'duyệt' : 'từ chối'}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
// Guest gửi yêu cầu đăng ký làm host
exports.requestHostRole = async (req, res) => {
  try {
    const userData = req.user;
    const user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role !== 'guest') {
      return res.status(400).json({ success: false, message: 'Chỉ guest mới có thể gửi yêu cầu làm host.' });
    }
    if (user.hostRequestStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Bạn đã gửi yêu cầu, vui lòng chờ admin duyệt.' });
    }
    if (user.hostRequestStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Bạn đã là host.' });
    }
    user.hostRequestStatus = 'pending';
    await user.save();
    return res.status(200).json({ success: true, message: 'Yêu cầu đăng ký làm host đã được gửi. Vui lòng chờ admin duyệt.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

// Guest rút lại yêu cầu đăng ký làm host
exports.withdrawHostRequest = async (req, res) => {
  try {
    const userData = req.user;
    const user = await User.findOne({ user_id: userData.user_id });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role !== 'guest') {
      return res.status(400).json({ success: false, message: 'Only guests can withdraw host requests.' });
    }
    
    if (user.hostRequestStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending host request found to withdraw.' });
    }
    
    // Reset hostRequestStatus to 'none' to allow user to submit a new request later
    user.hostRequestStatus = 'none';
    await user.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Host request has been successfully withdrawn. You can submit a new request anytime.' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};