import React, { useEffect, useState } from 'react';
import axios from '../../utils/axios';

const HostRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState({}); // { userId: 'pending' | 'success' | 'error' }

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/admin/host-requests');
      setRequests(res.data || []);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (userId, action) => {
    setActionStatus((prev) => ({ ...prev, [userId]: 'pending' }));
    try {
      await axios.post('/user/handle-host-request', { userId, action });
      setActionStatus((prev) => ({ ...prev, [userId]: 'success' }));
      fetchRequests();
    } catch (err) {
      setActionStatus((prev) => ({ ...prev, [userId]: 'error' }));
    }
  };

  if (loading) return <div>Đang tải danh sách yêu cầu...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Yêu cầu trở thành Host</h2>
      {requests.length === 0 ? (
        <div>Không có yêu cầu nào.</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Tên</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Thời gian gửi</th>
              <th className="p-2 border">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((user) => (
              <tr key={user.user_id}>
                <td className="p-2 border">{user.first_name} {user.last_name}</td>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border">{new Date(user.updatedAt || user.createdAt).toLocaleString()}</td>
                <td className="p-2 border">
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded mr-2 disabled:opacity-50"
                    disabled={actionStatus[user.user_id] === 'pending'}
                    onClick={() => handleAction(user.user_id, 'approve')}
                  >
                    Duyệt
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                    disabled={actionStatus[user.user_id] === 'pending'}
                    onClick={() => handleAction(user.user_id, 'reject')}
                  >
                    Từ chối
                  </button>
                  {actionStatus[user.user_id] === 'success' && <span className="ml-2 text-green-600">✔</span>}
                  {actionStatus[user.user_id] === 'error' && <span className="ml-2 text-red-600">Lỗi</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HostRequestsAdmin;
