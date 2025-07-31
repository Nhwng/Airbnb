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
            <button type="button" className="text-blue-600 text-sm underline hover:text-blue-800" onClick={() => setShowForgot(true)}>
              Quên mật khẩu?
            </button>
          </div>
        </form>

        <div className="mb-4 flex w-full items-center gap-4">
          <div className="h-0 w-1/2 border-[1px]"></div>
          <p className="small -mt-1">or</p>
          <div className="h-0 w-1/2 border-[1px]"></div>
        </div>

        {/* Facebook login button */}
        <div className="flex h-[50px] justify-center">
          <FacebookLogin
            appId="24380064454961670"
            autoLoad={false}
            callback={handleFacebookLogin}
            render={renderProps => (
              <button className="primary w-[350px] flex items-center justify-center gap-2" onClick={renderProps.onClick}>
                <svg width="24" height="24" fill="#1877f3" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
                Đăng nhập với Facebook
              </button>
            )}
          />
        </div>

        <div className="py-2 text-center text-gray-500">
          Don't have an account yet?{' '}
          <Link className="text-black underline" to={'/register'}>
            Register now
          </Link>
        </div>

        {/* Modal Quên mật khẩu */}
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white p-6 rounded shadow-lg w-80 relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowForgot(false)}>&times;</button>
              <h2 className="text-lg font-semibold mb-2">Quên mật khẩu</h2>
              <p className="mb-2 text-sm text-gray-600">Nhập email đã đăng ký để nhận mật khẩu mới.</p>
              <input
                type="email"
                className="w-full border rounded px-2 py-1 mb-2"
                placeholder="Nhập email của bạn"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
              />
              <button
                className="primary w-full"
                disabled={forgotLoading || !forgotEmail}
                onClick={async () => {
                  setForgotLoading(true);
                  try {
                    const res = await axios.post('/forgot-password', { email: forgotEmail });
                    toast.success(res.data.message || 'Đã gửi mật khẩu mới!');
                    setShowForgot(false);
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
                  } finally {
                    setForgotLoading(false);
                  }
                }}
              >
                {forgotLoading ? 'Đang gửi...' : 'Gửi mật khẩu mới'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
