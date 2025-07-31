import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const VerifyPinPage = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/user/verify-email-pin', { email, pin });
      if (res.data.token) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực thất bại');
    }
  };

  const handleResendPin = async () => {
    setError('');
    try {
      const res = await axios.post('/user/resend-email-pin', { email });
      setError('Đã gửi lại mã xác thực.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi lại mã thất bại');
    }
  };

  if (!email) {
    return <div className="flex items-center justify-center min-h-screen">Không tìm thấy email để xác thực.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl mb-4">Nhập mã xác thực đã gửi tới email</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-80">
        <input
          type="text"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Nhập mã PIN"
          className="border p-2 rounded"
        />
        {error && <div className={error.includes('Đã gửi lại') ? 'text-green-600' : 'text-red-500'}>{error}</div>}
        <button type="submit" className="primary">Xác thực</button>
        <button type="button" className="mt-2 underline text-blue-600" onClick={handleResendPin}>Gửi lại mã PIN</button>
      </form>
    </div>
  );
};

export default VerifyPinPage;
