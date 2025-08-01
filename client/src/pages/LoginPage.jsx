import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

import ProfilePage from './ProfilePage';
import { useAuth } from '../../hooks';

import axios from '../utils/axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [redirect, setRedirect] = useState(false);
  const auth = useAuth();

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleFormData = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const response = await auth.login(formData);
    if (response.success) {
      toast.success(response.message);
      setRedirect(true);
    } else {
      toast.error(response.message);
    }
  };

  const handleFacebookLogin = async (response) => {
    if (!response.accessToken) {
      toast.error('Facebook login failed!');
      return;
    }
    const res = await auth.facebookLogin(response.accessToken);
    if (res.success) {
      toast.success(res.message);
      setRedirect(true);
    } else {
      toast.error(res.message);
    }
  };

  if (redirect) {
    return <Navigate to={'/'} />;
  }

  if (auth.user) {
    return <ProfilePage />;
  }

  return (
    <div className="mt-4 flex grow items-center justify-around p-4 md:p-0">
      <div className="mb-40">
        <h1 className="mb-4 text-center text-4xl">Login</h1>
        <form className="mx-auto max-w-md" onSubmit={handleFormSubmit}>
          <input
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleFormData}
          />
          <input
            name="password"
            type="password"
            placeholder="password"
            value={formData.password}
            onChange={handleFormData}
          />
          <button className="primary my-4">Login</button>
          <div className="text-right">
            <button type="button" className="text-rose-600 text-sm underline hover:text-rose-800" onClick={() => setShowForgot(true)}>
              Forgot password?
            </button>
          </div>
        </form>

        <div className="mb-4 flex w-full items-center gap-4">
          <div className="h-0 w-1/2 border-[1px]"></div>
          <p className="small -mt-1">or</p>
          <div className="h-0 w-1/2 border-[1px]"></div>
        </div>

        {/* Facebook login button */}
        <div className="flex justify-center">
          <FacebookLogin
            appId="24380064454961670"
            autoLoad={false}
            callback={handleFacebookLogin}
            render={renderProps => (
              <button 
                className="w-full max-w-md flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm"
                onClick={renderProps.onClick}
              >
                <svg width="20" height="20" fill="#1877f3" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/>
                </svg>
                Continue with Facebook
              </button>
            )}
          />
        </div>

        <div className="py-2 text-center text-gray-500">
          Don't have an account yet?{' '}
          <Link className="text-rose-600 underline hover:text-rose-800" to={'/register'}>
            Register now
          </Link>
        </div>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl" onClick={() => setShowForgot(false)}>&times;</button>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">Reset your password</h2>
              <p className="mb-4 text-sm text-gray-600">Enter your email address and we'll send you a new password.</p>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Enter your email address"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
              />
              <button
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={forgotLoading || !forgotEmail}
                onClick={async () => {
                  setForgotLoading(true);
                  try {
                    const res = await axios.post('/forgot-password', { email: forgotEmail });
                    toast.success(res.data.message || 'New password sent to your email!');
                    setShowForgot(false);
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Something went wrong!');
                  } finally {
                    setForgotLoading(false);
                  }
                }}
              >
                {forgotLoading ? 'Sending...' : 'Send new password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
