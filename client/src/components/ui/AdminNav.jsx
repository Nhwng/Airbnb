import React from 'react';
import { BarChart3, Users, Home, Settings } from 'lucide-react';

const AdminNav = ({ activeView, setActiveView }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users
    },
    {
      id: 'listings',
      label: 'Listings',
      icon: Home
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  const getNavClasses = (itemId) => {
    const baseClasses = 'flex items-center gap-2 py-3 px-6 rounded-full transition-colors font-medium';
    return activeView === itemId 
      ? `${baseClasses} bg-rose-600 text-white`
      : `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  };

  return (
    <nav className="py-6">
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={getNavClasses(item.id)}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminNav;