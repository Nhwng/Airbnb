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
  Calendar,
  Phone,
  MapPin,
  Star,
  Shield,
  Eye,
  Ban,
  Users
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-toastify';

const CustomerManagementModule = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    page: 1
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: 10,
        search: filters.search,
        role: filters.role,
        status: filters.status
      });

      const { data } = await axiosInstance.get(`/admin/users?${params}`);
      setCustomers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleRoleFilter = (role) => {
    setFilters({ ...filters, role, page: 1 });
  };

  const handleStatusFilter = (status) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleUpdateCustomer = async (customerId, updates) => {
    try {
      await axiosInstance.put(`/admin/users/${customerId}`, updates);
      toast.success('Customer updated successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await axiosInstance.delete(`/admin/users/${customerId}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'host':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'guest':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Customer Management</h2>
            <p className="text-gray-600 mt-1">Manage customer accounts, profiles, and access controls</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: {pagination.total} customers
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Export Data
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Role Filters */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleRoleFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filters.role === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleRoleFilter('guest')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filters.role === 'guest'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Guests
              </button>
              <button
                onClick={() => handleRoleFilter('host')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filters.role === 'host'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hosts
              </button>
            </div>

            {/* Status Filters */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleStatusFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filters.status === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => handleStatusFilter('active')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filters.status === 'active'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleStatusFilter('suspended')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filters.status === 'suspended'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Hosts</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.role === 'host').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Superhosts</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.is_superhost).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => {
                  const created = new Date(c.createdAt);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                        {customer.picture_url ? (
                          <img 
                            src={customer.picture_url} 
                            alt="" 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {customer.first_name?.[0]}{customer.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-1" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(customer.role)}`}>
                        {customer.role}
                      </span>
                      {customer.is_superhost && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Superhost
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(customer.status || 'active')}`}>
                      {customer.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateCustomer(customer.user_id, { 
                          role: customer.role === 'host' ? 'guest' : 'host' 
                        })}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Toggle Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateCustomer(customer.user_id, { 
                          is_superhost: !customer.is_superhost 
                        })}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Toggle Superhost"
                      >
                        {customer.is_superhost ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleUpdateCustomer(customer.user_id, { 
                          status: customer.status === 'suspended' ? 'active' : 'suspended' 
                        })}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Toggle Status"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.user_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Customer"
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

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Customer Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  {selectedCustomer.picture_url ? (
                    <img 
                      src={selectedCustomer.picture_url} 
                      alt="" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium text-xl">
                      {selectedCustomer.first_name?.[0]}{selectedCustomer.last_name?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </h4>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-gray-900">{selectedCustomer.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-gray-900">{selectedCustomer.status || 'active'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Joined Date</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Superhost</label>
                  <p className="mt-1 text-gray-900">
                    {selectedCustomer.is_superhost ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {selectedCustomer.about && (
                <div>
                  <label className="text-sm font-medium text-gray-700">About</label>
                  <p className="mt-1 text-gray-900">{selectedCustomer.about}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementModule;