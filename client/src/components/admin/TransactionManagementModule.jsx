// src/components/admin/TransactionManagementModule.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';

const ALL_STATUSES = ['confirmed', 'cancelled', 'completed'];

const TransactionManagementModule = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/reservations');
      setTransactions(data.reservations);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axiosInstance.put(`/reservations/${id}/status`, { status: newStatus });
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  if (loading) return <p>Loading transactions…</p>;
  if (error)   return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Transaction Management</h2>
      <p className="text-gray-600 mb-4">Monitor all purchase transactions</p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Listing</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Check-In → Check-Out</th>
              <th className="p-2">Guests</th>
              <th className="p-2">Total</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => {
              const nextStatuses = ALL_STATUSES.filter(s => s !== tx.status);
              return (
                <tr key={tx._id} className="border-b">
                  <td className="p-2">{tx._id.slice(-6)}</td>

                  {/* Listing title */}
                  <td className="p-2">
                    {tx.listing_id && typeof tx.listing_id === 'object'
                      ? tx.listing_id.title
                      : tx.listing_id}
                  </td>

                  {/* Customer full name */}
                  <td className="p-2">
                    {tx.user_id && typeof tx.user_id === 'object'
                      ? `${tx.user_id.first_name} ${tx.user_id.last_name}`
                      : tx.user_id}
                  </td>

                  <td className="p-2">
                    {new Date(tx.check_in).toLocaleDateString()} →{' '}
                    {new Date(tx.check_out).toLocaleDateString()}
                  </td>
                  <td className="p-2">{tx.num_of_guests}</td>
                  <td className="p-2">{formatVND(tx.total_price)}</td>
                  <td className="p-2 capitalize">{tx.status}</td>

                  {/* Stack action buttons vertically with space */}
                  <td className="p-2 flex flex-col space-y-1">
                    {nextStatuses.map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(tx._id, s)}
                        className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionManagementModule;
