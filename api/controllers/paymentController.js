const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Availability = require('../models/Availability');
const { createZaloPayOrder } = require('../services/zalopayService');
const CryptoJS = require('crypto-js');
const { zalopayConfig } = require('../config/zalopayConfig');

exports.createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod = 'sandbox' } = req.body;
    const userData = req.user;

    const order = await Order.findOne({ 
      order_id: Number(orderId),
      user_id: userData.user_id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status',
      });
    }

    if (new Date() > order.expires_at) {
      order.status = 'expired';
      await order.save();
      return res.status(400).json({
        success: false,
        message: 'Order has expired',
      });
    }

    const transactionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let paymentResult = null;
    let amount = order.total_price;

    if (paymentMethod === 'zalopay') {
      const vndAmount = Math.round(amount * 24000);
      paymentResult = await createZaloPayOrder(vndAmount, order.order_id, userData.user_id);
      amount = vndAmount;
    }

    const payment = await Payment.create({
      order_id: order.order_id,
      user_id: userData.user_id,
      amount: amount,
      currency: paymentMethod === 'zalopay' ? 'VND' : 'USD',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      external_transaction_id: paymentResult?.app_trans_id,
      gateway_response: paymentResult,
      callback_url: paymentMethod === 'zalopay' ? zalopayConfig.callback_url : null,
      return_url: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/payment/callback` : 'http://localhost:5173/payment/callback'
    });

    if (paymentMethod === 'sandbox') {
      payment.status = 'completed';
      await payment.save();

      order.status = 'paid';
      await order.save();

      await Availability.updateMany(
        { 
          listing_id: order.listing_id, 
          date: { $gte: order.check_in, $lt: order.check_out } 
        },
        { $set: { is_available: false } }
      );

      const reservation = await Reservation.create({
        listing_id: order.listing_id,
        user_id: order.user_id,
        check_in: order.check_in,
        check_out: order.check_out,
        num_of_guests: order.num_of_guests,
        name: order.guest_name,
        phone: order.guest_phone,
        total_price: order.total_price,
        order_id: order.order_id,
        payment_id: payment.payment_id,
      });

      return res.status(201).json({
        success: true,
        message: 'Payment completed successfully',
        payment,
        reservation,
        paymentUrl: null
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      payment,
      paymentUrl: paymentResult?.order_url || null
    });

  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.handleZaloPayCallback = async (req, res) => {
  try {
    console.log('Received ZaloPay callback:', req.body);
    const { data: dataStr, mac: reqMac } = req.body;
    
    if (!zalopayConfig || !zalopayConfig.key2) {
      throw new Error('ZaloPay config not properly initialized');
    }

    const mac = CryptoJS.HmacSHA256(dataStr, zalopayConfig.key2).toString();
    if (reqMac !== mac) {
      return res.status(400).json({ 
        return_code: -1, 
        return_message: 'MAC verification failed' 
      });
    }

    const paymentData = JSON.parse(dataStr);
    const appUserMatch = paymentData.app_user.match(/user_(\d+)_order_(\d+)/);
    
    if (!appUserMatch) {
      return res.status(400).json({ 
        return_code: -1, 
        return_message: 'Invalid app_user format' 
      });
    }

    const [, userId, orderId] = appUserMatch;
    const status = paymentData.status === 1 ? 'completed' : 'failed';

    const payment = await Payment.findOne({ 
      order_id: Number(orderId),
      user_id: Number(userId),
      payment_method: 'zalopay'
    });

    if (!payment) {
      return res.status(400).json({ 
        return_code: -1, 
        return_message: 'Payment not found' 
      });
    }

    payment.status = status;
    payment.gateway_response = { ...payment.gateway_response, callback: paymentData };
    await payment.save();

    const order = await Order.findOne({ order_id: Number(orderId) });
    if (order) {
      order.status = status === 'completed' ? 'paid' : 'cancelled';
      await order.save();

      if (status === 'completed') {
        await Availability.updateMany(
          { 
            listing_id: order.listing_id, 
            date: { $gte: order.check_in, $lt: order.check_out } 
          },
          { $set: { is_available: false } }
        );

        await Reservation.create({
          listing_id: order.listing_id,
          user_id: order.user_id,
          check_in: order.check_in,
          check_out: order.check_out,
          num_of_guests: order.num_of_guests,
          name: order.guest_name,
          phone: order.guest_phone,
          total_price: order.total_price,
          order_id: order.order_id,
          payment_id: payment.payment_id,
        });
      }
    }

    return res.json({ 
      return_code: 1, 
      return_message: 'Success' 
    });
  } catch (error) {
    console.error('ZaloPay callback error:', error);
    return res.status(500).json({ 
      return_code: 0,
      return_message: error.message 
    });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userData = req.user;

    const payment = await Payment.findOne({ 
      payment_id: Number(paymentId),
      user_id: userData.user_id 
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (err) {
    console.error('Error getting payment:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.getUserPayments = async (req, res) => {
  try {
    const userData = req.user;
    
    const payments = await Payment.find({ user_id: userData.user_id })
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (err) {
    console.error('Error getting user payments:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};