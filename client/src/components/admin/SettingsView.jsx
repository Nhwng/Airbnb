import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Settings as SettingsIcon, 
  Globe, 
  Mail, 
  DollarSign, 
  Shield, 
  Bell,
  Upload,
  Users,
  Home
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import { toast } from 'react-toastify';

const SystemSettingsModule = () => {
  const [settings, setSettings] = useState({
    site_name: '',
    maintenance_mode: false,
    registration_enabled: true,
    max_upload_size: 10,
    default_currency: 'VND',
    email_notifications: true,
    sms_notifications: false,
    booking_auto_approval: false,
    commission_rate: 15,
    featured_listings_limit: 20
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axiosInstance.get('/admin/settings');
        setSettings(data.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/admin/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const settingSections = [
    {
      title: 'General Settings',
      icon: SettingsIcon,
      items: [
        {
          key: 'site_name',
          label: 'Site Name',
          type: 'text',
          description: 'The name of your platform'
        },
        {
          key: 'maintenance_mode',
          label: 'Maintenance Mode',
          type: 'toggle',
          description: 'Enable maintenance mode to prevent user access'
        },
        {
          key: 'registration_enabled',
          label: 'User Registration',
          type: 'toggle',
          description: 'Allow new users to register on the platform'
        }
      ]
    },
    {
      title: 'File & Upload Settings',
      icon: Upload,
      items: [
        {
          key: 'max_upload_size',
          label: 'Max Upload Size (MB)',
          type: 'number',
          description: 'Maximum file size for image uploads'
        }
      ]
    },
    {
      title: 'Currency & Pricing',
      icon: DollarSign,
      items: [
        {
          key: 'default_currency',
          label: 'Default Currency',
          type: 'select',
          options: [
            { value: 'VND', label: 'Vietnamese Dong (₫)' },
            { value: 'USD', label: 'US Dollar ($)' },
            { value: 'EUR', label: 'Euro (€)' }
          ],
          description: 'Default currency for the platform'
        },
        {
          key: 'commission_rate',
          label: 'Commission Rate (%)',
          type: 'number',
          description: 'Platform commission rate for bookings'
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          key: 'email_notifications',
          label: 'Email Notifications',
          type: 'toggle',
          description: 'Send email notifications to users'
        },
        {
          key: 'sms_notifications',
          label: 'SMS Notifications',
          type: 'toggle',
          description: 'Send SMS notifications to users'
        }
      ]
    },
    {
      title: 'Booking Settings',
      icon: Home,
      items: [
        {
          key: 'booking_auto_approval',
          label: 'Auto-approve Bookings',
          type: 'toggle',
          description: 'Automatically approve booking requests'
        },
        {
          key: 'featured_listings_limit',
          label: 'Featured Listings Limit',
          type: 'number',
          description: 'Maximum number of featured listings on homepage'
        }
      ]
    }
  ];

  const renderInput = (item) => {
    switch (item.type) {
      case 'text':
        return (
          <input
            type="text"
            value={settings[item.key]}
            onChange={(e) => handleInputChange(item.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={settings[item.key]}
            onChange={(e) => handleInputChange(item.key, Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        );
      case 'select':
        return (
          <select
            value={settings[item.key]}
            onChange={(e) => handleInputChange(item.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          >
            {item.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'toggle':
        return (
          <button
            type="button"
            onClick={() => handleInputChange(item.key, !settings[item.key])}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings[item.key] ? 'bg-rose-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings[item.key] ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">System Settings</h2>
            <p className="text-gray-600 mt-1">Configure your platform settings and preferences</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {settingSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <div key={sectionIndex} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>

                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">
                          {item.label}
                        </label>
                        {renderInput(item)}
                      </div>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            <Shield className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Security Audit</p>
              <p className="text-sm text-blue-700">Run security check</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
            <Mail className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">Email Test</p>
              <p className="text-sm text-green-700">Send test email</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
            <Globe className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-900">Clear Cache</p>
              <p className="text-sm text-purple-700">Clear system cache</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsModule;