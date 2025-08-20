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

    // Check if there's already a pending payment for this order
    let existingPayment = await Payment.findOne({
      order_id: Number(orderId),
      user_id: userData.user_id,
      status: 'pending'
    });

    // If payment exists and it's for ZaloPay, check if it's likely expired (older than 15 minutes)
    if (existingPayment && paymentMethod === 'zalopay') {
      const paymentAge = new Date() - existingPayment.created_at;
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      if (paymentAge > fifteenMinutes) {
        // Mark old payment as expired and create a new one
        existingPayment.status = 'failed';
        await existingPayment.save();
        existingPayment = null; // Set to null to create new payment
      }
    }

    // If we have a valid existing payment, return it with the payment URL
    if (existingPayment) {
      const paymentUrl = existingPayment.gateway_response?.order_url || null;
      return res.status(200).json({
        success: true,
        message: 'Existing payment found',
        payment: existingPayment,
        paymentUrl: paymentUrl
      });
    }

    const transactionId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    let paymentResult = null;
    let amount = order.total_price;
    
    console.log('DEBUG - Original order amount:', amount);

    if (paymentMethod === 'zalopay') {
      // Assume the order amount is already in VND, no conversion needed
      // If your prices are in USD, uncomment the next line:
      // const vndAmount = Math.round(amount * 24000);
      console.log('DEBUG - Amount being sent to ZaloPay:', amount);
      paymentResult = await createZaloPayOrder(amount, order.order_id, userData.user_id);
      console.log('DEBUG - Amount after ZaloPay call:', amount);
      // amount remains the same since it's already in VND
    }

    const payment = await Payment.create({
      order_id: order.order_id,
      user_id: userData.user_id,
      amount: amount,
      currency: paymentMethod === 'zalopay' ? 'VND' : 'VND', // Using VND as base currency
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
    console.log('=== ZaloPay Callback Received ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
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
    // Updated regex to match reference format: user_123_order456 (no underscore before order)
    const appUserMatch = paymentData.app_user.match(/user_(\d+)_order(\d+)/);
    
    if (!appUserMatch) {
      console.log('Invalid app_user format:', paymentData.app_user);
      return res.status(400).json({ 
        return_code: -1, 
        return_message: 'Invalid app_user format' 
      });
    }

    const [, userId, orderId] = appUserMatch;
    // ZaloPay callback is only triggered for successful payments
    const status = 'paid';
    
    console.log('Processing payment:', { userId, orderId, status });

    // Update order status directly (following reference pattern)
    const order = await Order.findOne({ order_id: Number(orderId) });
    if (!order) {
      return res.status(400).json({ 
        return_code: -1, 
        return_message: 'Order not found' 
      });
    }

    order.status = status;
    await order.save();
    console.log('Order status updated:', order.status);

    // If payment successful, update payment status and create reservation
    if (status === 'paid') {
      // Update payment status
      const payment = await Payment.findOne({ 
        order_id: Number(orderId),
        user_id: Number(userId),
        payment_method: 'zalopay'
      });

      if (payment) {
        payment.status = 'completed';
        payment.gateway_response = { ...payment.gateway_response, callback: paymentData };
        await payment.save();
        console.log('Payment status updated to completed');
      }

      // Update availability
      await Availability.updateMany(
        { 
          listing_id: order.listing_id, 
          date: { $gte: order.check_in, $lt: order.check_out } 
        },
        { $set: { is_available: false } }
      );
      console.log('Availability updated');

      // Create reservation
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
        payment_id: payment ? payment.payment_id : null,
      });
      console.log('Reservation created:', reservation._id);
    }

    return res.json({ 
      return_code: 1, 
      return_message: 'Success' 
    });
  } catch (error) {
    console.error('ZaloPay callback error:', error);
    return res.status(500).json({ 
      return_code: 0, // ZaloPay will retry
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

exports.refreshPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userData = req.user;

    const payment = await Payment.findOne({
      payment_id: Number(paymentId),
      user_id: userData.user_id,
      status: 'pending'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pending payment not found',
      });
    }

    // Get the associated order
    const order = await Order.findOne({ 
      order_id: payment.order_id,
      user_id: userData.user_id 
    });

    if (!order || order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Associated order is not valid for payment',
      });
    }

    if (new Date() > order.expires_at) {
      order.status = 'expired';
      await order.save();
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Order has expired',
      });
    }

    // Only refresh ZaloPay payments (sandbox doesn't need refresh)
    if (payment.payment_method === 'zalopay') {
      // Mark old payment as failed
      payment.status = 'failed';
      await payment.save();

      // Create new ZaloPay payment
      const paymentResult = await createZaloPayOrder(payment.amount, order.order_id, userData.user_id);
      const transactionId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const newPayment = await Payment.create({
        order_id: order.order_id,
        user_id: userData.user_id,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: 'zalopay',
        transaction_id: transactionId,
        external_transaction_id: paymentResult?.app_trans_id,
        gateway_response: paymentResult,
        callback_url: zalopayConfig.callback_url,
        return_url: payment.return_url
      });

      return res.status(200).json({
        success: true,
        message: 'Payment refreshed successfully',
        payment: newPayment,
        paymentUrl: paymentResult?.order_url || null
      });
    } else {
      // For sandbox or other methods, just return existing payment
      return res.status(200).json({
        success: true,
        message: 'Payment is still valid',
        payment,
        paymentUrl: null
      });
    }

  } catch (err) {
    console.error('Error refreshing payment:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

