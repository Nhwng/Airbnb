
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, CreditCard, Users, MapPin, Edit, Gavel } from 'lucide-react';
import AccountNav from '@/components/ui/AccountNav';
import Spinner from '@/components/ui/Spinner';
import axiosInstance from '@/utils/axios';

const ListingCard = ({ listing, onAuctionRequest }) => {
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [auctionForm, setAuctionForm] = useState({
    check_in_date: '',
    check_out_date: '',
    auction_duration_days: 14,
    starting_price: listing.nightly_price || 0,
    buyout_price: (listing.nightly_price || 0) * 1.5
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Helper functions for date calculations
  const getMinCheckInDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 21); // 14 days auction + 7 days buffer
    return minDate.toISOString().split('T')[0];
  };

  const getMinCheckOutDate = () => {
    if (!auctionForm.check_in_date) return '';
    const checkIn = new Date(auctionForm.check_in_date);
    checkIn.setDate(checkIn.getDate() + 1); // Minimum 1 night
    return checkIn.toISOString().split('T')[0];
  };

  const calculateNights = () => {
    if (!auctionForm.check_in_date || !auctionForm.check_out_date) return 0;
    const checkIn = new Date(auctionForm.check_in_date);
    const checkOut = new Date(auctionForm.check_out_date);
    const diffTime = checkOut - checkIn;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTimeline = () => {
    if (!auctionForm.check_in_date || !auctionForm.auction_duration_days) return null;
    
    const checkIn = new Date(auctionForm.check_in_date);
    const auctionEnd = new Date(checkIn);
    auctionEnd.setDate(auctionEnd.getDate() - 7); // 7 days before check-in
    
    const auctionStart = new Date(auctionEnd);
    auctionStart.setDate(auctionStart.getDate() - parseInt(auctionForm.auction_duration_days));
    
    return {
      auctionStart: auctionStart.toLocaleDateString(),
      auctionEnd: auctionEnd.toLocaleDateString(),
      checkIn: checkIn.toLocaleDateString(),
      checkOut: auctionForm.check_out_date ? new Date(auctionForm.check_out_date).toLocaleDateString() : '',
      nights: calculateNights()
    };
  };

  const validateForm = () => {
    const errors = [];
    const checkIn = new Date(auctionForm.check_in_date);
    const checkOut = new Date(auctionForm.check_out_date);
    const today = new Date();
    
    // Check minimum lead time (21 days)
    const minCheckIn = new Date();
    minCheckIn.setDate(minCheckIn.getDate() + 21);
    if (checkIn < minCheckIn) {
      errors.push('Check-in date must be at least 21 days from today (14 days auction + 7 days buffer)');
    }
    
    // Check if check-out is after check-in
    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }
    
    // Validate auction can start in time
    const auctionEnd = new Date(checkIn);
    auctionEnd.setDate(auctionEnd.getDate() - 7);
    const auctionStart = new Date(auctionEnd);
    auctionStart.setDate(auctionStart.getDate() - parseInt(auctionForm.auction_duration_days));
    
    if (auctionStart <= today) {
      errors.push('Auction cannot start in the past. Please choose later accommodation dates or shorter auction duration.');
    }
    
    // Price validation
    if (parseFloat(auctionForm.buyout_price) <= parseFloat(auctionForm.starting_price)) {
      errors.push('Buyout price must be higher than starting price');
    }
    
    if (parseFloat(auctionForm.starting_price) <= 0 || parseFloat(auctionForm.buyout_price) <= 0) {
      errors.push('Starting price and buyout price must be greater than 0');
    }
    
    return errors;
  };

  // Update timeline when form changes
  React.useEffect(() => {
    setTimeline(calculateTimeline());
    setValidationErrors(validateForm());
  }, [auctionForm]);

  const handleAuctionSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Calculate auction timeline
      const checkIn = new Date(auctionForm.check_in_date);
      const checkOut = new Date(auctionForm.check_out_date);
      const auctionEnd = new Date(checkIn);
      auctionEnd.setDate(auctionEnd.getDate() - 7); // 7 days before check-in
      const auctionStart = new Date(auctionEnd);
      auctionStart.setDate(auctionStart.getDate() - parseInt(auctionForm.auction_duration_days));
      
      await axiosInstance.post('/auctions/request', {
        listing_id: listing.listing_id,
        check_in_date: auctionForm.check_in_date,
        check_out_date: auctionForm.check_out_date,
        auction_duration_days: parseInt(auctionForm.auction_duration_days),
        auction_start_date: auctionStart.toISOString(),
        auction_end_date: auctionEnd.toISOString(),
        total_nights: calculateNights(),
        starting_price: parseFloat(auctionForm.starting_price),
        buyout_price: parseFloat(auctionForm.buyout_price)
      });
      
      setShowAuctionModal(false);
      setAuctionForm({
        check_in_date: '',
        check_out_date: '',
        auction_duration_days: 14,
        starting_price: listing.nightly_price || 0,
        buyout_price: (listing.nightly_price || 0) * 1.5
      });
      setValidationErrors([]);
      setTimeline(null);
      
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Register for Auction</h3>
            <p className="text-gray-600 mb-6">Submit your room for auction approval by admin.</p>
            
            <form onSubmit={handleAuctionSubmit}>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Enhanced Auction Rules</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• Auction must end at least <strong>7 days before</strong> check-in</p>
                        <p>• Minimum <strong>21 days lead time</strong> required for auctions</p>
                        <p>• Choose flexible auction duration (7-30 days)</p>
                        <p>• Set competitive starting and buyout prices</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Period */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Accommodation Period</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        required
                        min={getMinCheckInDate()}
                        value={auctionForm.check_in_date}
                        onChange={(e) => setAuctionForm(prev => ({ ...prev, check_in_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Must be at least 21 days from today
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        required
                        min={getMinCheckOutDate()}
                        value={auctionForm.check_out_date}
                        onChange={(e) => setAuctionForm(prev => ({ ...prev, check_out_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        disabled={!auctionForm.check_in_date}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {calculateNights() > 0 ? `${calculateNights()} nights` : 'Select check-in first'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auction Configuration */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Auction Configuration</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auction Duration
                    </label>
                    <select
                      value={auctionForm.auction_duration_days}
                      onChange={(e) => setAuctionForm(prev => ({ ...prev, auction_duration_days: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    >
                      <option value="7">1 week (7 days)</option>
                      <option value="14">2 weeks (14 days) - Recommended</option>
                      <option value="21">3 weeks (21 days)</option>
                      <option value="30">1 month (30 days)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Longer auctions may attract more bidders
                    </p>
                  </div>
                </div>

                {/* Timeline Preview */}
                {timeline && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Auction Timeline Preview</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <div>• <strong>Auction starts:</strong> {timeline.auctionStart}</div>
                      <div>• <strong>Auction ends:</strong> {timeline.auctionEnd}</div>
                      <div>• <strong>7-day buffer period</strong></div>
                      <div>• <strong>Check-in:</strong> {timeline.checkIn}</div>
                      {timeline.checkOut && <div>• <strong>Check-out:</strong> {timeline.checkOut}</div>}
                      <div>• <strong>Stay duration:</strong> {timeline.nights} nights</div>
                    </div>
                  </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Please fix the following:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pricing */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Pricing</h4>
                  <div className="grid grid-cols-2 gap-4">
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
                      {timeline && timeline.nights > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Suggested: {new Intl.NumberFormat('vi-VN').format((listing.nightly_price || 0) * timeline.nights * 0.8)}₫ (80% of regular price)
                        </p>
                      )}
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
                      {timeline && timeline.nights > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Suggested: {new Intl.NumberFormat('vi-VN').format((listing.nightly_price || 0) * timeline.nights * 1.2)}₫ (120% of regular price)
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Buyout price allows guests to skip bidding and book immediately
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
                  disabled={submitting || validationErrors.length > 0}
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
