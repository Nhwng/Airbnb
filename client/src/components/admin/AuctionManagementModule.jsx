import React, { useState, useEffect } from 'react';
import { 
  Gavel, 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign,
  Check, 
  X, 
  Eye,
  RefreshCw
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';

const AuctionRequestCard = ({ request, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const handleStatusUpdate = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this auction request?`)) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put(`/auctions/admin/request/${request._id}`, {
        status,
        admin_notes: adminNotes
      });
      
      onUpdate();
      alert(`Request ${status} successfully!`);
      setShowDetails(false);
      setAdminNotes('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update request status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
              <Gavel className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{request.listing?.title}</h3>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <User className="w-4 h-4 mr-1" />
                {request.host?.name} ({request.host?.email})
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <Eye className="w-4 h-4 mr-1" />
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm">{request.listing?.city}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm font-medium">Starting: {formatPrice(request.starting_price)}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm">{formatDate(request.check_in_date)} - {formatDate(request.check_out_date)}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm">Created: {formatDate(request.created_at)}</span>
          </div>
        </div>

        {/* Auction Details Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-gray-700">
            <Gavel className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm">Buyout: {formatPrice(request.buyout_price)}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm">Auction: {formatDate(request.auction_start_date)} - {formatDate(request.auction_end_date)}</span>
          </div>
        </div>

        {showDetails && (
          <div className="border-t pt-4">
            {request.listing?.firstImage && (
              <div className="mb-4">
                <img 
                  src={request.listing.firstImage.url} 
                  alt={request.listing.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div className="space-y-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Listing Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Capacity:</span>
                    <span className="ml-2 font-medium">{request.listing?.person_capacity || 1} guests</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Base Price:</span>
                    <span className="ml-2 font-medium">{formatPrice(request.listing?.nightly_price || 0)}/night</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Nights:</span>
                    <span className="ml-2 font-medium">{request.total_nights} nights</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Auction Duration:</span>
                    <span className="ml-2 font-medium">{request.auction_duration_days} days</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Auction Timeline</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Auction Period:</span>
                      <div className="text-blue-900 mt-1">
                        {formatDate(request.auction_start_date)} → {formatDate(request.auction_end_date)}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">Stay Period:</span>
                      <div className="text-green-900 mt-1">
                        {formatDate(request.check_in_date)} → {formatDate(request.check_out_date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Pricing Details</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 mb-1">Starting Price</div>
                    <div className="font-bold text-gray-900">{formatPrice(request.starting_price)}</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-green-600 mb-1">Buyout Price</div>
                    <div className="font-bold text-green-900">{formatPrice(request.buyout_price)}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-blue-600 mb-1">Price Difference</div>
                    <div className="font-bold text-blue-900">
                      {formatPrice(request.buyout_price - request.starting_price)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes or feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusUpdate('approved')}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AuctionManagementModule = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/auctions/admin/pending');
      setRequests(data);
    } catch (error) {
      console.error('Error fetching auction requests:', error);
      alert('Failed to fetch auction requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleUpdate = () => {
    fetchPendingRequests();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auction Management</h1>
          <p className="text-gray-600 mt-1">Review and approve auction requests from hosts</p>
        </div>
        <button
          onClick={fetchPendingRequests}
          className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <h3 className="font-medium text-rose-900 mb-1">Pending Requests: {requests.length}</h3>
            <p className="text-sm text-rose-700">
              Review each request carefully before approving. Approved auctions will become active immediately.
            </p>
          </div>

          {requests.map((request) => (
            <AuctionRequestCard
              key={request._id}
              request={request}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gavel className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Pending Auction Requests</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            There are currently no auction requests waiting for approval. New requests will appear here when hosts submit them.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuctionManagementModule;