import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gavel, 
  Clock, 
  MapPin, 
  Users, 
  TrendingUp, 
  Timer,
  Eye,
  ChevronDown,
  AlertCircle,
  Info
} from 'lucide-react';
import axiosInstance from '@/utils/axios'; 
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const AuctionCard = ({ auction }) => {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
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
  }, [auction.auction_end]);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative">
        {auction.listing?.firstImage && (
          <img 
            src={auction.listing.firstImage.url}
            alt={auction.listing.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="absolute top-3 left-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isAuctionActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isAuctionActive ? 'Active' : 'Ended'}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs font-medium">
            <Timer className="w-3 h-3 inline mr-1" />
            {getTimeRemainingText()}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
              {auction.listing?.title}
            </h3>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {auction.listing?.city}
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-4">
          {/* Auction Timeline */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">🕐 Auction Timeline</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex justify-between">
                <span>Auction ends:</span>
                <span className="font-medium">{formatDate(auction.auction_end)}</span>
              </div>
              <div className="flex justify-between">
                <span>Time remaining:</span>
                <span className="font-medium text-red-600">{getTimeRemainingText()}</span>
              </div>
            </div>
          </div>

          {/* Accommodation Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-green-900 mb-2">🏠 Accommodation Details</h4>
            <div className="space-y-1 text-xs text-green-800">
              <div className="flex justify-between">
                <span>Check-in Date:</span>
                <span className="font-medium">{auction.check_in_date ? formatDate(auction.check_in_date) : 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out Date:</span>
                <span className="font-medium">{auction.check_out_date ? formatDate(auction.check_out_date) : 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Stay Duration:</span>
                <span className="font-medium">{auction.total_nights || 'N/A'} nights</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Capacity:</span>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span className="font-medium">{auction.listing?.person_capacity} guests</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Starting Price:</span>
            <span className="text-gray-400 line-through">{formatPrice(auction.starting_price)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Buyout Price:</span>
            <span className="font-medium text-green-600">{formatPrice(auction.buyout_price)}</span>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-rose-600 mr-2" />
              <span className="font-semibold text-rose-900">Current Bid</span>
            </div>
            <span className="text-xl font-bold text-rose-900">{formatPrice(auction.current_bid)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-rose-700">
            <span>{auction.bid_count} bids placed</span>
            {auction.highest_bidder && (
              <span>Leading bidder</span>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/auctions/${auction._id}`}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-1" />
            Details
          </Link>
          {user && isAuctionActive && (
            <>
              <Link
                to={`/auctions/${auction._id}/bid`}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
              >
                <Gavel className="w-4 h-4 mr-1" />
                Bid
              </Link>
              <Link
                to={`/auctions/${auction._id}/buyout`}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Buyout
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AuctionRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Auction and Rental Rules</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3">1. Classification of Rental Types</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Direct Rental (Next 2 Weeks):</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Available for bookings from today up to 14 days ahead</li>
                    <li>Instant booking at standard room prices</li>
                    <li>Fixed pricing with immediate confirmation</li>
                    <li>No auction required for these dates</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Auction Rental (Day 15 Onwards):</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Required for all bookings starting from day 15 onwards</li>
                    <li>Competitive bidding system with starting price</li>
                    <li>Buyout option available for immediate booking</li>
                    <li>Highest bidder wins when auction ends</li>
                    <li>2-week auction period before accommodation dates</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3">2. Auction Rules</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>All bids are binding and cannot be retracted</li>
                <li>Each new bid must be higher than the current highest bid</li>
                <li>Minimum bid increment is 10,000₫</li>
                <li><strong>Buyout option:</strong> Pay the buyout price to win immediately</li>
                <li>Auction ends when buyout is used or time expires</li>
                <li>Winner must complete payment within 24 hours</li>
                <li>Failed payments result in offer going to second-highest bidder</li>
                <li>No refunds once auction is won (except host cancellation)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3">3. Payment and Booking</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Payment must be completed within 24 hours of winning auction</li>
                <li>Accepted payment methods: ZaloPay, bank transfer</li>
                <li>Booking confirmation sent after successful payment</li>
                <li>Check-in details provided 48 hours before accommodation date</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3">4. Cancellation Policy</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Host cancellations: Full refund + 25% compensation</li>
                <li>Guest cancellations after winning auction: No refund</li>
                <li>Force majeure events will be handled case by case</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
            >
              I Understand the Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuctionsPage = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  const fetchActiveAuctions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/auctions/active');
      setAuctions(data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      alert('Failed to fetch auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAuctions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Gavel className="w-12 h-12 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold">Live Auctions</h1>
            </div>
            <p className="text-xl md:text-2xl text-rose-100 max-w-3xl mx-auto mb-8">
              Bid on exclusive accommodations and win amazing stays at competitive prices
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!user && (
                <div className="bg-rose-600 bg-opacity-50 border border-rose-400 rounded-lg p-4 max-w-md">
                  <div className="flex items-center text-rose-100">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">Please login to place bids on auctions</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowRules(true)}
                className="inline-flex items-center px-6 py-3 bg-white text-rose-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Info className="w-5 h-5 mr-2" />
                View Auction Rules
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Active Auctions</h2>
            <p className="text-gray-600">{auctions.length} auctions currently active</p>
          </div>
          <button
            onClick={fetchActiveAuctions}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gavel className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Active Auctions</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              There are currently no active auctions. Check back later for new opportunities to bid on exclusive accommodations.
            </p>
          </div>
        )}
      </div>

      <AuctionRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};

export default AuctionsPage;