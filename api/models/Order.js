const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: {
    type: Number,
    unique: true,
  },
  listing_id: { 
    type: Number, 
    ref: 'Listing', 
    required: true 
  },
  user_id: { 
    type: Number, 
    ref: 'User', 
    required: true 
  },
  check_in: { 
    type: Date, 
    required: true 
  },
  check_out: { 
    type: Date, 
    required: true 
  },
  num_of_guests: { 
    type: Number, 
    required: true 
  },
  guest_name: { 
    type: String, 
    required: true 
  },
  guest_phone: { 
    type: String, 
    required: true 
  },
  total_price: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'expired'],
    default: 'pending'
  },
  expires_at: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
});

orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.order_id) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { order_id: -1 } });
    this.order_id = lastOrder ? lastOrder.order_id + 1 : 1;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;