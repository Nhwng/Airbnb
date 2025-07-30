import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AccountNav from '@/components/ui/AccountNav';
import Spinner from '@/components/ui/Spinner';
import axiosInstance from '@/utils/axios';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getOrders = async () => {
      try {
        const { data } = await axiosInstance.get('/orders');
        setOrders(data.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    getOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col items-center">
      <AccountNav />
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
        
        {orders?.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-md p-6 border"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.order_id}</h3>
                    <p className="text-gray-600">Created: {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p><strong>Guest:</strong> {order.guest_name}</p>
                    <p><strong>Phone:</strong> {order.guest_phone}</p>
                    <p><strong>Guests:</strong> {order.num_of_guests}</p>
                  </div>
                  <div>
                    <p><strong>Check-in:</strong> {new Date(order.check_in).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> {new Date(order.check_out).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ${order.total_price}</p>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="flex space-x-4">
                    <Link
                      to={`/payment/${order.order_id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Complete Payment
                    </Link>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to cancel this order?')) {
                          try {
                            await axiosInstance.delete(`/orders/${order.order_id}`);
                            setOrders(orders.filter(o => o.order_id !== order.order_id));
                          } catch (err) {
                            console.error('Error cancelling order:', err);
                          }
                        }
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {order.status === 'expired' && (
                  <p className="text-gray-600 italic">
                    This order expired on {new Date(order.expires_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">You haven't created any orders yet.</p>
            <Link
              to="/"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Browsing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;