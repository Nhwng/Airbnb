const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { isAdmin } = require('../middlewares/admin');
const { getHostRequests } = require('../controllers/adminController');

// Lấy danh sách user có yêu cầu làm host
router.get('/host-requests', isAdmin, getHostRequests);

// Get dashboard statistics
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalHosts = await User.countDocuments({ role: 'host' });
    const totalGuests = await User.countDocuments({ role: 'guest' });
    const totalListings = await Listing.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'paid' });

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ created_at: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalHosts,
          totalGuests,
          totalListings,
          totalOrders,
          pendingOrders,
          completedOrders
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get all users with pagination
router.get('/users', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    let query = { role: { $ne: 'admin' } };
    
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password -emailVerificationPin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Update user status/role
router.put('/users/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, is_superhost } = req.body;

    const updateData = {};
    if (role && ['host', 'guest'].includes(role)) {
      updateData.role = role;
    }
    if (typeof is_superhost === 'boolean') {
      updateData.is_superhost = is_superhost;
    }

    const user = await User.findOneAndUpdate(
      { user_id: userId },
      updateData,
      { new: true }
    ).select('-password -emailVerificationPin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/users/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOneAndDelete({ user_id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// System settings
router.get('/settings', isAdmin, async (req, res) => {
  try {
    // Initialize default settings if none exist
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.initializeDefaults();
    }
    
    // Get all settings
    const settings = await Settings.getAllSettings();

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Update system settings
router.put('/settings', isAdmin, async (req, res) => {
  try {
    const settings = req.body;
    const userData = req.user;
    const updatedSettings = {};
    
    // Type mapping for validation
    const settingTypes = {
      site_name: 'string',
      maintenance_mode: 'boolean',
      registration_enabled: 'boolean',
      max_upload_size: 'number',
      default_currency: 'string',
      email_notifications: 'boolean',
      sms_notifications: 'boolean',
      booking_auto_approval: 'boolean',
      commission_rate: 'number',
      featured_listings_limit: 'number'
    };
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      if (settingTypes[key]) {
        try {
          await Settings.setSetting(
            key, 
            value, 
            settingTypes[key], 
            `Updated via admin settings panel`,
            userData.user_id
          );
          updatedSettings[key] = value;
        } catch (error) {
          console.error(`Error updating setting ${key}:`, error);
        }
      }
    }
    
    // Get the updated settings to return
    const allSettings = await Settings.getAllSettings();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: allSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Get all listings for admin
router.get('/listings', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { room_type: { $regex: search, $options: 'i' } }
      ];
    }

    const listings = await Listing.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        listings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings'
    });
  }
});

module.exports = router;