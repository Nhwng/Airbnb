import React from 'react';
import { Package, Plus, Search, Filter } from 'lucide-react';

const CatalogManagementModule = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Catalog Management</h2>
            <p className="text-gray-600 mt-1">Manage product information and listings</p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Catalog Management Module</h3>
            <p className="text-gray-600 mb-4">This module will be implemented in the next phase</p>
            <div className="text-sm text-gray-500">
              Features coming soon:
              <ul className="mt-2 space-y-1">
                <li>• Product catalog management</li>
                <li>• Inventory tracking</li>
                <li>• Category management</li>
                <li>• Bulk product operations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogManagementModule;