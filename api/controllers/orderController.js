const Order = require('../models/Order');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Availability = require('../models/Availability');

exports.createOrder = async (req, res) => {
  try {
    const userData = req.user;
    const { place, checkIn, checkOut, numOfGuests, name, phone, price } = req.body;

    const listing_id = Number(place);

    const listing = await Listing.findOne({ listing_id });
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    const user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    checkInDate.setUTCHours(0, 0, 0, 0);
    checkOutDate.setUTCHours(0, 0, 0, 0);

    const order = await Order.create({
      listing_id,
      user_id: userData.user_id,
      check_in: checkInDate,
      check_out: checkOutDate,
      num_of_guests: numOfGuests || 1,
      guest_name: name,
      guest_phone: phone,
      total_price: price,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
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

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error('Error getting order:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userData = req.user;
    
    const orders = await Order.find({ user_id: userData.user_id })
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error('Error getting user orders:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
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
        message: 'Can only cancel pending orders',
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};