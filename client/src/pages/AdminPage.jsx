import HostRequestsAdmin from '@/components/admin/HostRequestsAdmin';
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import AdminSidebar from '@/components/ui/AdminSidebar';
import SystemSettingsModule from '@/components/admin/SettingsView';
import CatalogManagementModule from '@/components/admin/CatalogManagementModule';
import CustomerManagementModule from '@/components/admin/CustomerManagementModule';
import TransactionManagementModule from '@/components/admin/TransactionManagementModule';
import StatisticsManagementModule from '@/components/admin/StatisticsManagementModule';

const AdminPage = () => {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState('settings');

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'settings':
        return <SystemSettingsModule />;
      case 'catalog':
        return <CatalogManagementModule />;
      case 'customers':
        return <CustomerManagementModule />;
      case 'transactions':
        return <TransactionManagementModule />;
      case 'statistics':
        return <StatisticsManagementModule />;
      case 'hostRequests':
        return <HostRequestsAdmin />;
      default:
        return <SystemSettingsModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      
      <div className="flex-1">
        <div className="p-8">
          {renderModule()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;