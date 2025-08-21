import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Home, 
  ShoppingCart, 
  TrendingUp, 
  UserCheck,
  Clock,
  CheckCircle,
  Calendar
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';
import Spinner from '@/components/ui/Spinner';

const DashboardView = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await axiosInstance.get('/admin/dashboard');
        setDashboardData(data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Spinner />;

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  const { statistics, recentOrders } = dashboardData;

  const statCards = [
    {
      title: 'Total Users',
      value: statistics.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Listings',
      value: statistics.totalListings,
      icon: Home,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Orders',
      value: statistics.totalOrders,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      change: '+23%'
    },
    {
      title: 'Active Hosts',
      value: statistics.totalHosts,
      icon: UserCheck,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Orders Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-amber-600 mr-3" />
                <span className="font-medium text-gray-900">Pending Orders</span>
              </div>
              <span className="text-2xl font-bold text-amber-600">{statistics.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Completed Orders</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{statistics.completedOrders}</span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center mr-3">
                    <Calendar className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Order #{order.order_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.guest_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatVND(order.total_price)}</p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'pending' 
                      ? 'bg-amber-100 text-amber-800' 
                      : order.status === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">User Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{statistics.totalGuests}</p>
            <p className="text-sm text-gray-600">Total Guests</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{statistics.totalHosts}</p>
            <p className="text-sm text-gray-600">Total Hosts</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {((statistics.totalHosts / statistics.totalUsers) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Host Conversion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;