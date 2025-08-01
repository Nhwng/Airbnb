import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Home, 
  MapPin, 
  Users, 
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-toastify';

const ListingsView = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    page: 1
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: 12,
        search: filters.search
      });

      const { data } = await axiosInstance.get(`/admin/listings?${params}`);
      setListings(data.data.listings);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Listings Management</h2>
            <p className="text-gray-600 mt-1">Monitor and manage property listings</p>
          </div>
          <div className="text-sm text-gray-600">
            Total: {pagination.total} listings
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title, city, or property type..."
            value={filters.search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div key={listing._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
            {/* Image Placeholder */}
            <div className="relative h-48 bg-gray-200 flex items-center justify-center">
              <Home className="w-12 h-12 text-gray-400" />
              <div className="absolute top-3 right-3">
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                  ID: {listing.listing_id}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Title and Location */}
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                  {listing.title}
                </h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate">{listing.city}</span>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-700">
                  <Home className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">{listing.room_type}</span>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">
                    {listing.person_capacity} {listing.person_capacity === 1 ? 'guest' : 'guests'}
                  </span>
                </div>

                <div className="flex items-center text-gray-700">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-semibold text-rose-600">
                    ₫{formatPrice(listing.nightly_price)}
                  </span>
                  <span className="text-gray-500 ml-1 text-sm">/ night</span>
                </div>

                <div className="flex items-center text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">
                    Added {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                    title="Edit Listing"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <button
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {listings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-20 px-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">No listings found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {filters.search ? 'Try adjusting your search terms' : 'No property listings have been created yet'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.current} of {pagination.pages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsView;