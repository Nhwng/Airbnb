import React, { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Users, 
  Calendar, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import axios from '../../utils/axios';
import Spinner from '../ui/Spinner';
import { toast } from 'react-toastify';

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
      setError('Unable to load host requests.');
      toast.error('Failed to load host requests');
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
      toast.success(`Host request ${action}d successfully`);
      // Clear success status after 3 seconds
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [userId]: null }));
      }, 3000);
      fetchRequests();
    } catch (err) {
      setActionStatus((prev) => ({ ...prev, [userId]: 'error' }));
      toast.error(`Failed to ${action} host request`);
      // Clear error status after 3 seconds
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [userId]: null }));
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-gray-600">Loading host requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
          <div className="text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={fetchRequests}
              className="mt-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4 inline mr-1" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-rose-600" />
            Host Requests
          </h2>
          <p className="text-gray-600 mt-1">Review and manage user requests to become hosts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <Users className="w-4 h-4" />
            {requests.length} pending request{requests.length !== 1 ? 's' : ''}
          </div>
          <button 
            onClick={fetchRequests}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            All host requests have been processed. New requests will appear here for review.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-sm font-medium text-gray-900">User</th>
                  <th className="p-2 text-sm font-medium text-gray-900">Contact</th>
                  <th className="p-2 text-sm font-medium text-gray-900">Request Date</th>
                  <th className="p-2 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((user) => (
                  <tr key={user.user_id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.picture_url ? (
                            <img 
                              src={user.picture_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">ID: {user.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.updatedAt || user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={actionStatus[user.user_id] === 'pending'}
                          onClick={() => handleAction(user.user_id, 'approve')}
                        >
                          {actionStatus[user.user_id] === 'pending' ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={actionStatus[user.user_id] === 'pending'}
                          onClick={() => handleAction(user.user_id, 'reject')}
                        >
                          {actionStatus[user.user_id] === 'pending' ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Reject
                        </button>
                        {actionStatus[user.user_id] === 'success' && (
                          <span className="text-green-600 text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Done
                          </span>
                        )}
                        {actionStatus[user.user_id] === 'error' && (
                          <span className="text-red-600 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostRequestsAdmin;
