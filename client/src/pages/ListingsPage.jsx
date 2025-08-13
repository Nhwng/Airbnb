
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, CreditCard, Users, MapPin, Edit, Gavel } from 'lucide-react';
import AccountNav from '@/components/ui/AccountNav';
import Spinner from '@/components/ui/Spinner';
import axiosInstance from '@/utils/axios';

const ListingCard = ({ listing, onAuctionRequest }) => {
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [auctionForm, setAuctionForm] = useState({
    starting_price: listing.nightly_price || 0,
    buyout_price: (listing.nightly_price || 0) * 1.5
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAuctionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axiosInstance.post('/auctions/request', {
        listing_id: listing.listing_id,
        starting_price: auctionForm.starting_price,
        buyout_price: auctionForm.buyout_price
      });
      
      setShowAuctionModal(false);
      setAuctionForm({
        starting_price: listing.nightly_price || 0,
        buyout_price: (listing.nightly_price || 0) * 1.5
      });
      
      if (onAuctionRequest) {
        onAuctionRequest();
      }
      
      alert('Auction request submitted successfully! Wait for admin approval.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit auction request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <Home className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{listing.title}</h3>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {listing.created_at ? new Date(listing.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : ''}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAuctionModal(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <Gavel className="w-4 h-4 mr-1" /> Register for Auction
              </button>
              <Link
                to={`/account/listings/${listing.listing_id}/edit`}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              >
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Link>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-semibold text-lg">{listing.nightly_price} {listing.currency}</span>
              <span className="text-gray-500 ml-1">/night</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Users className="w-4 h-4 mr-3 text-gray-400" />
              <span>{listing.person_capacity} guests</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="w-4 h-4 mr-3 text-gray-400" />
              <span>{listing.city || 'N/A'}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="font-medium">Room type:</span>
              <span className="ml-2">{listing.room_type}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-700 line-clamp-4 text-sm">{listing.description}</div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Auction Registration Modal */}
      {showAuctionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Register for Auction</h3>
            <p className="text-gray-600 mb-6">Submit your room for auction approval by admin.</p>
            
            <form onSubmit={handleAuctionSubmit}>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Auction Information</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• Auctions apply to bookings from <strong>day 15 onwards</strong></p>
                        <p>• Direct rental is available for the <strong>next 2 weeks</strong></p>
                        <p>• Set competitive starting and buyout prices</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Bid Price (₫)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={auctionForm.starting_price}
                    onChange={(e) => setAuctionForm(prev => ({ ...prev, starting_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="Enter minimum starting price"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buyout Price (₫)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={auctionForm.buyout_price}
                    onChange={(e) => setAuctionForm(prev => ({ ...prev, buyout_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="Enter immediate purchase price"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Price for instant booking without waiting for auction to end
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAuctionModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const ListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getListings = async () => {
      try {
        const { data } = await axiosInstance.get('listings/user-listings');
        setListings(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    getListings();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AccountNav />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">My Accommodation</h1>
            <p className="text-gray-600">Manage your listed rooms for rent</p>
          </div>
          <Link
            className="inline-flex gap-1 rounded-full bg-rose-600 hover:bg-rose-700 py-2 px-6 text-white transition-colors"
            to={'/account/listings/new'}
          >
            <Home className="w-5 h-5 mr-1" />
            Add new room
          </Link>
        </div>
        {listings.length > 0 ? (
          <div className="space-y-6">
            {listings.map((listing) => (
              <ListingCard 
                key={listing.listing_id} 
                listing={listing} 
                onAuctionRequest={() => {
                  // Refresh listings or show success message
                  console.log('Auction request submitted for listing:', listing.listing_id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No rooms listed yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't listed any rooms for rent yet. Start by adding a new room!
            </p>
            <Link
              to="/account/listings/new"
              className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Add Room</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;
