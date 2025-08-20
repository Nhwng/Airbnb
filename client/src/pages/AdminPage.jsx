import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import AdminSidebar from '@/components/ui/AdminSidebar';
import SystemSettingsModule from '@/components/admin/SettingsView';
import CatalogManagementModule from '@/components/admin/CatalogManagementModule';
import CustomerManagementModule from '@/components/admin/CustomerManagementModule';
import TransactionManagementModule from '@/components/admin/TransactionManagementModule';
import StatisticsManagementModule from '@/components/admin/StatisticsManagementModule';
import AuctionManagementModule from '@/components/admin/AuctionManagementModule';
import HostRequestsAdmin from '@/components/admin/HostRequestsAdmin';
import DataSyncModule from '@/components/admin/DataSyncModule';

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
      case 'auctions':
        return <AuctionManagementModule />;
      case 'dataSync':
        return <DataSyncModule />;
      default:
        return <SystemSettingsModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <div className="flex-1 pt-20">
        <div className="max-w-5xl w-full mx-auto p-8">
          {renderModule()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;