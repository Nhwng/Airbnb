import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Mail,
  Calendar
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-toastify';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    page: 1
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: 10,
        search: filters.search,
        role: filters.role
      });

      const { data } = await axiosInstance.get(`/admin/users?${params}`);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleRoleFilter = (role) => {
    setFilters({ ...filters, role, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}`, updates);
      toast.success('User updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'host':
        return 'bg-green-100 text-green-800';
      case 'guest':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">Manage and monitor user accounts</p>
          </div>
          <div className="text-sm text-gray-600">
            Total: {pagination.total} users
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRoleFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.role === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => handleRoleFilter('guest')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.role === 'guest'
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Guests
            </button>
            <button
              onClick={() => handleRoleFilter('host')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.role === 'host'
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hosts
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                        {user.picture_url ? (
                          <img 
                            src={user.picture_url} 
                            alt="" 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {user.is_superhost ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <UserCheck className="w-4 h-4 mr-1" />
                          Superhost
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          Regular
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateUser(user.user_id, { 
                          role: user.role === 'host' ? 'guest' : 'host' 
                        })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Toggle Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateUser(user.user_id, { 
                          is_superhost: !user.is_superhost 
                        })}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Toggle Superhost"
                      >
                        {user.is_superhost ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.user_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.current} of {pagination.pages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersView;