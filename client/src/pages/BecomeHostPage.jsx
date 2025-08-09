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
      setMessage(res.data.message || 'Yêu cầu đã được gửi. Vui lòng chờ admin duyệt.');
      refreshUser && refreshUser();
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Đã có lỗi xảy ra.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Become a Host</h2>
        <p>Bạn cần đăng nhập để gửi yêu cầu trở thành host.</p>
      </div>
    );
  }

  if (user.role === 'host') {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Bạn đã là host!</h2>
        <button className="mt-4 px-4 py-2 bg-rose-600 text-white rounded" onClick={() => navigate('/account')}>Về trang cá nhân</button>
      </div>
    );
  }

  if (user.hostRequestStatus === 'pending') {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Yêu cầu đang chờ duyệt</h2>
        <p>Yêu cầu trở thành host của bạn đang được admin xem xét. Vui lòng chờ phản hồi.</p>
      </div>
    );
  }

  if (user.hostRequestStatus === 'approved') {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Chúc mừng!</h2>
        <p>Bạn đã được duyệt làm host. Hãy bắt đầu đăng chỗ ở ngay!</p>
        <button className="mt-4 px-4 py-2 bg-rose-600 text-white rounded" onClick={() => navigate('/account')}>Về trang cá nhân</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Đăng ký trở thành Host</h2>
      <p>Bạn muốn cho thuê chỗ ở trên Airbnb? Hãy gửi yêu cầu để trở thành host!</p>
      <button
        className="mt-6 px-6 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
        onClick={handleRequest}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Đang gửi...' : 'Gửi yêu cầu trở thành host'}
      </button>
      {message && <div className={`mt-4 ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</div>}
    </div>
  );
};

export default BecomeHostPage;
