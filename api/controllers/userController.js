const User = require('../models/User');
const cookieToken = require('../utils/cookieToken');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

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

    user = await User.create({
      user_id: Math.floor(100000 + Math.random() * 900000),
      first_name,
      last_name,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      picture_url: picture_url || '',
    });

    cookieToken(user, res);
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

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    if (!first_name || !email) {
      return res.status(400).json({
        message: 'First name and email are required',
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        user_id: Math.floor(100000 + Math.random() * 900000),
        first_name,
        last_name,
        email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        role: 'guest',
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