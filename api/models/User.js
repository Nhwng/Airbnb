const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationPin: {
    type: String,
    select: false,
  },
  user_id: {
    type: Number,
    required: true,
    unique: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
  },
  picture_url: {
    type: String,
  },
  is_superhost: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    required: true,
    enum: ['host', 'guest'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
    emailVerificationPinCreatedAt: {
    type: Date,
    select: false,
  },
}, { timestamps: true });

userSchema.methods.getJwtToken = function () {
  return jwt.sign({ user_id: this.user_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

userSchema.methods.isValidatedPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;