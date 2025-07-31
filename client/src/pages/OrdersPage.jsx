import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CreditCard, User, Phone, Users, Home, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending': 
        return {
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          icon: <Clock className="w-4 h-4" />,
          text: 'Pending Payment'
        };
      case 'paid': 
        return {
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Confirmed'
        };
      case 'cancelled': 
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Cancelled'
        };
      case 'expired': 
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Expired'
        };
      default: 
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Unknown'
        };
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AccountNav />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">Track and manage your booking orders</p>
        </div>
        
        {orders?.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            Order #{order.order_id}
                          </h3>
                          <div className="flex items-center text-gray-500 text-sm mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            Created {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                        {statusConfig.icon}
                        <span className="ml-1.5">{statusConfig.text}</span>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Guest Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 border-b border-gray-100 pb-2 mb-3">
                          Guest Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <User className="w-4 h-4 mr-3 text-gray-400" />
                            <span className="font-medium">{order.guest_name}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <Phone className="w-4 h-4 mr-3 text-gray-400" />
                            <span>{order.guest_phone}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <Users className="w-4 h-4 mr-3 text-gray-400" />
                            <span>{order.num_of_guests} {order.num_of_guests === 1 ? 'guest' : 'guests'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 border-b border-gray-100 pb-2 mb-3">
                          Booking Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {new Date(order.check_in).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })} - {new Date(order.check_out).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {Math.ceil((new Date(order.check_out) - new Date(order.check_in)) / (1000 * 60 * 60 * 24))} nights
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                            <div>
                              <span className="font-semibold text-lg">${order.total_price}</span>
                              <span className="text-gray-500 ml-1">total</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {order.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                        <Link
                          to={`/payment/${order.order_id}`}
                          className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium text-center flex items-center justify-center space-x-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Complete Payment</span>
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
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel Order</span>
                        </button>
                      </div>
                    )}

                    {order.status === 'expired' && (
                      <div className="bg-gray-50 rounded-xl p-4 mt-4">
                        <div className="flex items-center text-gray-600">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            This order expired on {new Date(order.expires_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No orders yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't created any booking orders yet. Start exploring amazing places to stay!
            </p>
            <Link
              to="/"
              className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Start Exploring</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;