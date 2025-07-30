import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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

  const handlePayment = async (paymentMethod) => {
    setProcessing(true);
    try {
      const { data } = await axiosInstance.post('/payments', {
        orderId: order.order_id,
        paymentMethod
      });

      if (paymentMethod === 'sandbox') {
        // Sandbox payment completes immediately
        toast.success('Payment completed successfully!');
        setRedirect('/account/bookings');
      } else if (paymentMethod === 'zalopay' && data.paymentUrl) {
        // Redirect to ZaloPay payment page
        window.location.href = data.paymentUrl;
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Payment</h1>
        
        {/* Order Expiry Warning */}
        {timeRemaining > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 font-medium">
                Order expires in {timeRemaining} minutes
              </span>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Order ID:</span>
              <span className="font-medium">#{order.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Guest Name:</span>
              <span className="font-medium">{order.guest_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Phone:</span>
              <span className="font-medium">{order.guest_phone}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-in:</span>
              <span className="font-medium">{new Date(order.check_in).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out:</span>
              <span className="font-medium">{new Date(order.check_out).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests:</span>
              <span className="font-medium">{order.num_of_guests}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${order.total_price}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Choose Payment Method</h2>
          
          {/* Sandbox Payment */}
          <button
            onClick={() => handlePayment('sandbox')}
            disabled={processing}
            className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processing ? (
              <Spinner />
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                </svg>
                Pay with Test Card (Sandbox)
              </>
            )}
          </button>

          {/* ZaloPay Payment */}
          <button
            onClick={() => handlePayment('zalopay')}
            disabled={processing}
            className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processing ? (
              <Spinner />
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
                Pay with ZaloPay
              </>
            )}
          </button>
        </div>

        {/* Cancel Order */}
        <div className="mt-6 pt-6 border-t">
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
            className="text-red-600 hover:text-red-800 underline"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;