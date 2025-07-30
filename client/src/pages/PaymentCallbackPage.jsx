import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [message, setMessage] = useState('Processing your payment...');
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get ZaloPay callback parameters
        const apptransid = searchParams.get('apptransid');
        const status = searchParams.get('status');
        
        if (!apptransid) {
          setStatus('failed');
          setMessage('Invalid payment callback');
          return;
        }

        // ZaloPay status: 1 = success, -1 = failed, 0 = processing
        if (status === '1') {
          // Payment successful - check our backend for reservation
          const userPayments = await axiosInstance.get('/payments');
          const payment = userPayments.data.payments.find(
            p => p.external_transaction_id === apptransid && p.status === 'completed'
          );

          if (payment) {
            // Get the reservation created from this payment
            const reservations = await axiosInstance.get('/reservations');
            const reservation = reservations.data.reservations.find(
              r => r.payment_id === payment.payment_id
            );

            setReservation(reservation);
            setStatus('success');
            setMessage('Payment completed successfully! Your booking is confirmed.');
            toast.success('Payment successful! Booking confirmed.');
          } else {
            setStatus('processing');
            setMessage('Payment is being processed. Please wait...');
            // Retry after a few seconds
            setTimeout(() => handleCallback(), 3000);
          }
        } else if (status === '-1') {
          setStatus('failed');
          setMessage('Payment failed. Please try again.');
          toast.error('Payment failed');
        } else {
          setStatus('processing');
          setMessage('Payment is being processed...');
          // Retry after a few seconds
          setTimeout(() => handleCallback(), 3000);
        }
      } catch (err) {
        console.error('Callback handling error:', err);
        setStatus('failed');
        setMessage('An error occurred while processing your payment.');
        toast.error('Payment processing error');
      }
    };

    handleCallback();
  }, [searchParams]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner />
        <p className="mt-4 text-lg text-gray-600">{message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        {status === 'success' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {reservation && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold mb-2">Booking Details</h2>
                <div className="text-left space-y-1">
                  <p><strong>Booking ID:</strong> {reservation._id}</p>
                  <p><strong>Check-in:</strong> {new Date(reservation.check_in).toLocaleDateString()}</p>
                  <p><strong>Check-out:</strong> {new Date(reservation.check_out).toLocaleDateString()}</p>
                  <p><strong>Guests:</strong> {reservation.num_of_guests}</p>
                  <p><strong>Total:</strong> ${reservation.total_price}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Link
                to="/account/bookings"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                View My Bookings
              </Link>
              <Link
                to="/"
                className="block w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300"
              >
                Continue Browsing
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-4">
              <Link
                to="/"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </Link>
              <Link
                to="/account/bookings"
                className="block w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300"
              >
                View My Bookings
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;