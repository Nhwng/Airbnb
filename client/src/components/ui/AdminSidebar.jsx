import React from 'react';
import { 
  Settings, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3,
  ChevronRight
} from 'lucide-react';

const AdminSidebar = ({ activeModule, setActiveModule }) => {
  const modules = [
    {
      id: 'settings',
      label: 'System Settings',
      description: 'Platform configuration',
      icon: Settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      id: 'catalog',
      label: 'Catalog Management',
      description: 'Product information',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    },
    {
      id: 'customers',
      label: 'Customer Management',
      description: 'User accounts & profiles',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      id: 'hostRequests',
      label: 'Host Requests',
      description: 'Duyệt yêu cầu làm host',
      icon: Users,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      hoverColor: 'hover:bg-rose-100'
    },
    {
      id: 'transactions',
      label: 'Transaction Management',
      description: 'Purchase history & status',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    },
    {
      id: 'statistics',
      label: 'Statistics Management',
      description: 'Analytics & reports',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100'
    }
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your platform</p>
      </div>
      
      <nav className="p-4">
        <div className="space-y-2">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? `${module.bgColor} border-2 border-opacity-50 ${module.color.replace('text-', 'border-')}`
                    : `hover:bg-gray-50 ${module.hoverColor}`
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-white' : module.bgColor
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive ? module.color : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${
                      isActive ? module.color : 'text-gray-900'
                    }`}>
                      {module.label}
                    </p>
                    <p className={`text-sm ${
                      isActive ? module.color.replace('600', '500') : 'text-gray-500'
                    }`}>
                      {module.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${
                  isActive 
                    ? `${module.color} transform rotate-90` 
                    : 'text-gray-400 group-hover:text-gray-600'
                }`} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;