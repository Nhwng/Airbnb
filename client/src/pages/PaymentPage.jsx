import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Clock, AlertTriangle, User, Phone, Users, Calendar, CreditCard, Home, ArrowLeft, Shield } from 'lucide-react';

import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const PaymentPage = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [redirect, setRedirect] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axiosInstance.get(`/orders/${orderId}`);
        setOrder(data.order);
        
        // Check if order is still valid
        if (data.order.status !== 'pending') {
          toast.error(`Order is ${data.order.status}. Cannot proceed with payment.`);
          setRedirect('/account/bookings');
          return;
        }
        
        // Check if order has expired
        if (new Date() > new Date(data.order.expires_at)) {
          toast.error('Order has expired. Please create a new booking.');
          setRedirect('/');
          return;
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        toast.error('Order not found');
        setRedirect('/');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && user) {
      fetchOrder();
    } else if (!user) {
      setRedirect('/login');
    }
  }, [orderId, user]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data } = await axiosInstance.post('/payments', {
        orderId: order.order_id,
        paymentMethod: 'zalopay'
      });

      if (data.paymentUrl) {
        // Redirect to ZaloPay payment page
        window.open(data.paymentUrl, '_self');
        // Fallback
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 100);
      } else {
        toast.error('Payment initiation failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Order not found</h2>
          <p className="text-gray-600 mt-2">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const timeRemaining = Math.max(0, Math.floor((new Date(order.expires_at) - new Date()) / 1000 / 60));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setRedirect('/account/orders')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Orders
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-semibold text-gray-900">Complete Payment</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <Home className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Order #{order.order_id}</h2>
                    <p className="text-gray-600 text-sm">Review your booking details</p>
                  </div>
                </div>
              </div>

              {/* Order Expiry Warning */}
              {timeRemaining > 0 && (
                <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
                    <div>
                      <div className="font-medium text-amber-800">
                        Order expires in {timeRemaining} minutes
                      </div>
                      <div className="text-sm text-amber-700 mt-1">
                        Complete your payment before the order expires
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Guest Information */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                      Guest Information
                    </h3>
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
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                      Booking Details
                    </h3>
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
                        <Clock className="w-4 h-4 mr-3 text-gray-400" />
                        <div className="text-sm">
                          <div className="font-medium">Order Created</div>
                          <div className="text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-lg font-medium text-gray-900">Total Amount</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">${order.total_price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                <p className="text-gray-600 text-sm mt-1">Secure payment powered by ZaloPay</p>
              </div>

              <div className="p-6">
                {/* ZaloPay Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || timeRemaining <= 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  {processing ? (
                    <>
                      <Spinner />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">Z</span>
                      </div>
                      <span className="font-semibold text-lg">Pay with ZaloPay</span>
                      <CreditCard className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Security Notice */}
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center text-green-700">
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Your payment information is encrypted and secure
                  </p>
                </div>

                {/* Cancel Order */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        try {
                          await axiosInstance.delete(`/orders/${order.order_id}`);
                          toast.success('Order cancelled successfully');
                          setRedirect('/');
                        } catch (err) {
                          toast.error('Failed to cancel order');
                        }
                      }
                    }}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;