import React, { useState } from 'react';
import axiosInstance from '@/utils/axios';
import { toast } from 'react-toastify';
import Spinner from '@/components/ui/Spinner';

const DataSyncModule = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const handleSyncData = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Please provide check-in and check-out dates');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await axiosInstance.post('/listings/sync-data', {
        checkIn,
        checkOut
      });
      setMessage(response.data.message || 'Data sync completed successfully');
      toast.success('Data sync completed successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error syncing data');
      toast.error('Failed to sync data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900">Data Synchronization</h2>
      <p className="text-gray-600 mb-4">
        This module allows admins to manually sync Airbnb data across the platform.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-in Date (YYYY-MM-DD)
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-out Date (YYYY-MM-DD)
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
      </div>

      <button
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        onClick={handleSyncData}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner size="small" />
            Syncing...
          </div>
        ) : (
          'Sync Data Manually'
        )}
      </button>
      {message && <p className="mt-4 text-lg text-gray-800">{message}</p>}
    </div>
  );
};

export default DataSyncModule;