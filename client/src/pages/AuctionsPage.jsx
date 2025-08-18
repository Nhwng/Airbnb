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
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const isAuctionActive = timeRemaining !== null;

  const getDaysRemaining = () => {
    if (!timeRemaining) return 0;
    return timeRemaining.days || 0;
  };

  const getTotalNights = () => {
    return auction.total_nights || 'N/A';
  };

  return (
    <Link 
      to={`/auctions/${auction._id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Property Image - Clean without overlapping badges */}
      <div className="relative">
        {auction.listing?.firstImage && (
          <img 
            src={auction.listing.firstImage.url}
            alt={auction.listing.title}
            className="w-full h-48 object-cover"
          />
        )}
        {/* Subtle gradient overlay for better transition */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent"></div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Status Header - Clear separation from image */}
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
            isAuctionActive 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isAuctionActive ? 'bg-white animate-pulse' : 'bg-gray-200'
            }`}></div>
            {isAuctionActive ? 'LIVE AUCTION' : 'AUCTION ENDED'}
          </div>
          
          {/* Enhanced Days Left Display */}
          {getDaysRemaining() > 0 ? (
            <div className="bg-blue-100 border border-blue-300 px-3 py-1.5 rounded-lg">
              <div className="flex items-center text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                <span className="text-xs font-bold">
                  {getDaysRemaining()}
                </span>
                <span className="text-xs font-medium ml-1">
                  day{getDaysRemaining() !== 1 ? 's' : ''} left
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg">
              <div className="flex items-center text-red-800">
                <Timer className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">
                  {getTimeRemainingText()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Property Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {auction.listing?.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{auction.listing?.city}</span>
            <span className="mx-2">•</span>
            <Users className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{auction.listing?.person_capacity} guests</span>
          </div>
        </div>

        {/* Stay Information */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center">
              <span className="text-purple-600 font-medium block mb-1">Stay Duration</span>
              <div className="text-lg font-bold text-purple-900">
                {getTotalNights()}
              </div>
              <div className="text-purple-600">nights</div>
            </div>
            <div className="text-center">
              <span className="text-green-600 font-medium block mb-1">Check-in</span>
              <div className="text-sm font-semibold text-green-900">
                {auction.check_in_date ? formatDate(auction.check_in_date) : 'TBD'}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="space-y-3 mb-4">
          {/* Current Bid - Prominent */}
          <div className="bg-rose-50 border-l-4 border-rose-400 rounded-r-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-rose-600 font-medium mb-1">CURRENT BID</div>
                <div className="text-xl font-bold text-rose-900">{formatPrice(auction.current_bid)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-rose-600">{auction.bid_count || 0} bids</div>
                <TrendingUp className="w-5 h-5 text-rose-500 mt-1 ml-auto" />
              </div>
            </div>
          </div>

          {/* Price Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Starting</div>
              <div className="text-sm font-semibold text-gray-400 line-through">
                {formatPrice(auction.starting_price)}
              </div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Buyout</div>
              <div className="text-sm font-bold text-green-700">
                {formatPrice(auction.buyout_price)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Primary Actions for Active Auctions */}
          {user && isAuctionActive ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/auctions/${auction._id}/bid`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 transition-colors"
              >
                <Gavel className="w-4 h-4 mr-1.5" />
                Place Bid
              </Link>
              <Link
                to={`/auctions/${auction._id}/buyout`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Buy Now
              </Link>
            </div>
          ) : (
            <div className="text-center">
              {!user && (
                <div className="text-xs text-gray-500 mb-2">Login required to bid</div>
              )}
              {!isAuctionActive && (
                <div className="text-xs text-gray-500 mb-2">Auction has ended</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
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