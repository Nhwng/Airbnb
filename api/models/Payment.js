const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: {
    type: Number,
    unique: true,
  },
  order_id: {
    type: Number,
    ref: 'Order',
    required: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  payment_method: {
    type: String,
    enum: ['zalopay', 'stripe', 'paypal', 'sandbox', 'momo', 'vnpay'],
    default: 'sandbox'
  },
  transaction_id: {
    type: String,
    required: true
  },
  external_transaction_id: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  payment_data: {
    type: mongoose.Schema.Types.Mixed
  },
  gateway_response: {
    type: mongoose.Schema.Types.Mixed
  },
  callback_url: {
    type: String
  },
  return_url: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.payment_id) {
    const lastPayment = await this.constructor.findOne({}, {}, { sort: { payment_id: -1 } });
    this.payment_id = lastPayment ? lastPayment.payment_id + 1 : 1;
  }
  this.updated_at = new Date();
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;