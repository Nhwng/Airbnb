const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;