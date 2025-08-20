import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Gavel, 
  Clock, 
  MapPin, 
  Users, 
  TrendingUp, 
  Timer,
  ArrowLeft,
  Calendar,
  Home
} from 'lucide-react';
import axiosInstance from '@/utils/axios'; 
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      try {
        const { data } = await axiosInstance.get(`/auctions/${id}`);
        setAuction(data);
      } catch (error) {
        console.error('Error fetching auction details:', error);
        alert('Failed to fetch auction details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAuctionDetails();
    }
  }, [id]);

  useEffect(() => {
    if (!auction) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.auction_end).getTime();
      const difference = endTime - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining({ days, hours, minutes });
      } else {
        setTimeRemaining(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [auction]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeRemainingText = () => {
    if (!timeRemaining) return 'Auction ended';
    
    const { days, hours, minutes } = timeRemaining;
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const isAuctionActive = timeRemaining !== null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h1>
          <Link to="/auctions" className="text-rose-600 hover:text-rose-700">
            ← Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            to="/auctions" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Image */}
            {auction.listing?.firstImage && (
              <div className="mb-6">
                <img 
                  src={auction.listing.firstImage.url}
                  alt={auction.listing.title}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Property Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {auction.listing?.title}
              </h1>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                {auction.listing?.city}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{auction.listing?.person_capacity} guests</span>
                </div>
                <div className="flex items-center">
                  <Home className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{auction.listing?.room_type}</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">
                {auction.listing?.description}
              </p>
            </div>

            {/* Auction Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Auction & Stay Timeline</h2>
              
              <div className="space-y-4">
                {/* Auction Timeline */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">🔥 Auction Phase</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Auction ends:</span>
                      <span className="font-medium">{formatDate(auction.auction_end)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time remaining:</span>
                      <span className={`font-medium ${isAuctionActive ? 'text-red-600' : 'text-gray-500'}`}>
                        {getTimeRemainingText()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accommodation Timeline */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-3">🏠 Accommodation Phase</h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <div className="flex justify-between">
                      <span>Check-in date:</span>
                      <span className="font-medium">
                        {auction.check_in_date ? formatDate(auction.check_in_date) : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-out date:</span>
                      <span className="font-medium">
                        {auction.check_out_date ? formatDate(auction.check_out_date) : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stay duration:</span>
                      <span className="font-medium">{auction.total_nights || 'N/A'} nights</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Current Bid Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="text-center mb-4">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  isAuctionActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isAuctionActive ? 'Active Auction' : 'Auction Ended'}
                </div>
              </div>

              {/* Current Bid */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-rose-600 mr-2" />
                    <span className="font-semibold text-rose-900">Current Bid</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-900 mb-2">
                  {formatPrice(auction.current_bid)}
                </div>
                <div className="text-sm text-rose-700">
                  {auction.bids?.length || 0} bids placed
                </div>
              </div>

              {/* Pricing Info */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Starting Price:</span>
                  <span className="text-gray-400 line-through">{formatPrice(auction.starting_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Buyout Price:</span>
                  <span className="font-medium text-green-600">{formatPrice(auction.buyout_price)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {user && isAuctionActive && (
                <div className="space-y-3">
                  <Link
                    to={`/auctions/${auction._id}/bid`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    Place Bid
                  </Link>
                  {auction.current_bid < auction.buyout_price ? (
                    <Link
                      to={`/auctions/${auction._id}/buyout`}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Buy Now - {formatPrice(auction.buyout_price)}
                    </Link>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed opacity-60">
                      Buy Now Unavailable - Current bid exceeds buyout price
                    </div>
                  )}
                </div>
              )}

              {!user && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Login to place bids</p>
                  <Link to="/login" className="text-rose-600 hover:text-rose-700 text-sm font-medium">
                    Login Now
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Bids */}
            {auction.bids && auction.bids.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bids</h3>
                <div className="space-y-3">
                  {auction.bids.slice(0, 5).map((bid, index) => (
                    <div key={bid._id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-900">{formatPrice(bid.bid_amount)}</div>
                        <div className="text-xs text-gray-500">
                          by {bid.bidder?.name || 'Anonymous'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(bid.bid_time).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;