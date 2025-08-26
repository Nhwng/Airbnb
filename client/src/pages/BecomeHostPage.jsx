import React, { useState } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../../hooks';
import { useNavigate } from 'react-router-dom';

const BecomeHostPage = () => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRequest = async () => {
    setStatus('loading');
    try {
      const res = await axios.post('/user/request-host');
      setStatus('success');
      setMessage(res.data.message || 'Your request has been submitted. Please wait for admin approval.');
      refreshUser && refreshUser();
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Đã có lỗi xảy ra.');
    }
  };

  const handleWithdrawRequest = async () => {
    if (!window.confirm('Are you sure you want to withdraw your host request? You can submit a new request later if needed.')) {
      return;
    }
    
    setStatus('loading');
    try {
      const res = await axios.post('/user/withdraw-host-request');
      setStatus('success');
      setMessage(res.data.message || 'Host request has been withdrawn successfully.');
      refreshUser && refreshUser();
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to withdraw request.');
    }
  };

  if (!user) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Become a Host</h2>
          <p className="text-gray-600">You need to login to submit a host request.</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (user.role === 'host') {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">You're Already a Host!</h2>
            <p className="text-gray-600 mb-6">Welcome to our host community. Start managing your listings and bookings.</p>
            <button 
              className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors" 
              onClick={() => navigate('/account')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.hostRequestStatus === 'pending') {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Host Request Pending Review</h2>
          <p className="mb-6">Your host request is currently being reviewed by our admin team. Please wait for their response.</p>
          
          <div className="flex flex-col gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Status: Under Review</p>
                  <p className="text-sm text-yellow-700">We'll notify you once a decision is made</p>
                </div>
              </div>
            </div>
            
            <button
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              onClick={handleWithdrawRequest}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Processing...' : 'Withdraw Request'}
            </button>
            
            <p className="text-sm text-gray-600">
              You can withdraw your request at any time and submit a new one later if needed.
            </p>
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded ${status === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (user.hostRequestStatus === 'approved') {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Congratulations! 🎉</h2>
            <p className="text-gray-600 mb-6">Your host request has been approved! You can now start listing your properties and welcoming guests.</p>
            <button 
              className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors" 
              onClick={() => navigate('/account')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              <path d="M6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Become a Host</h2>
          <p className="text-gray-600 mb-6">Ready to share your space and earn extra income? Submit your request to become a host on our platform!</p>
          
          <button
            className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRequest}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Host Request'}
          </button>
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${status === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}
          
          <div className="mt-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Our admin team will review your request</li>
              <li>• You'll receive a notification once processed</li>
              <li>• Upon approval, you can start creating listings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeHostPage;
