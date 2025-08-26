const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: {
    type: String
  },
  updated_by: {
    type: Number,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Static method to get a setting by key
settingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

// Static method to set a setting
settingsSchema.statics.setSetting = async function(key, value, type, description = '', updated_by = null) {
  try {
    return await this.findOneAndUpdate(
      { key },
      { 
        value, 
        type, 
        description, 
        updated_by,
        updated_at: new Date()
      },
      { 
        upsert: true, 
        new: true 
      }
    );
  } catch (error) {
    throw error;
  }
};

// Static method to get all settings as an object
settingsSchema.statics.getAllSettings = async function() {
  try {
    const settings = await this.find({});
    const settingsObj = {};
    
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    return settingsObj;
  } catch (error) {
    return {};
  }
};

// Static method to initialize default settings
settingsSchema.statics.initializeDefaults = async function() {
  const defaults = [
    { key: 'site_name', value: 'Airbnb Clone', type: 'string', description: 'The name of your platform' },
    { key: 'maintenance_mode', value: false, type: 'boolean', description: 'Enable maintenance mode to prevent user access' },
    { key: 'registration_enabled', value: true, type: 'boolean', description: 'Allow new users to register on the platform' },
    { key: 'max_upload_size', value: 10, type: 'number', description: 'Maximum file size for image uploads (MB)' },
    { key: 'default_currency', value: 'VND', type: 'string', description: 'Default currency for the platform' },
    { key: 'email_notifications', value: true, type: 'boolean', description: 'Send email notifications to users' },
    { key: 'sms_notifications', value: false, type: 'boolean', description: 'Send SMS notifications to users' },
    { key: 'booking_auto_approval', value: false, type: 'boolean', description: 'Automatically approve booking requests' },
    { key: 'commission_rate', value: 15, type: 'number', description: 'Platform commission rate for bookings (%)' },
    { key: 'featured_listings_limit', value: 20, type: 'number', description: 'Maximum number of featured listings on homepage' }
  ];

  try {
    for (const setting of defaults) {
      await this.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
    }
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;