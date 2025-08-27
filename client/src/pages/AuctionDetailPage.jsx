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
  Home,
  Zap,
  Star,
  AlertCircle,
  Eye,
  Award
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils'; 
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import PlaceGallery from '@/components/ui/PlaceGallery';
import { useAuth } from '../../hooks';
import { useAuctionUpdates } from '@/hooks/useAuctionSSE';
import { useDataCache } from '../contexts/DataCacheContext';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { getCachedData } = useDataCache();
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [images, setImages] = useState([]);

  // Use SSE hook for real-time updates
  const {
    auction,
    setAuction,
    recentBids,
    notifications,
    removeNotification,
    connectionStatus,
    isConnected,
    hasError,
    error
  } = useAuctionUpdates(id);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      try {
        const data = await getCachedData(`auction_detail_${id}`, async () => {
          const { data } = await axiosInstance.get(`/auctions/${id}`);
          return data;
        });
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
  }, [id, getCachedData]);

  // Fetch images for gallery
  useEffect(() => {
    if (!auction?.listing?.listing_id) return;
    
    const fetchImages = async () => {
      try {
        let imageData = [];
        
        // If auction has image, use it
        if (auction.listing.firstImage?.url) {
          imageData.push(auction.listing.firstImage.url);
        }
        
        // Try to fetch more images from listing
        try {
          const { data } = await axiosInstance.get(`/images/${auction.listing.listing_id}`);
          if (Array.isArray(data)) {
            const additionalImages = data.map((img) => {
              if (typeof img === 'string') return img;
              if (img?.url) return img.url;
              return null;
            }).filter(Boolean);
            imageData = [...new Set([...imageData, ...additionalImages])];
          }
        } catch (err) {
          console.log('Could not fetch additional images:', err.response?.status);
        }
        
        setImages(imageData);
      } catch (e) {
        console.error('Error fetching images:', e);
        setImages([]);
      }
    };
    
    fetchImages();
  }, [auction]);

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gavel className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Auction Not Found</h1>
          <p className="text-gray-600 mb-6">The auction you're looking for doesn't exist or has ended.</p>
          <Link 
            to="/auctions" 
            className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="py-4">
          <Link 
            to="/auctions" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
        </div>

        {/* Title and Basic Info */}
        <div className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold text-gray-900">
              {auction.listing?.title || 'Auction Property'}
            </h1>
            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold shadow-sm ${
              isAuctionActive 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <Gavel className="w-4 h-4 mr-2" />
              {isAuctionActive ? 'LIVE AUCTION' : 'AUCTION ENDED'}
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{auction.listing?.city || 'Unknown City'}</span>
            <span className="mx-2">•</span>
            <span>{auction.listing?.room_type || 'Property'}</span>
            <span className="mx-2">•</span>
            <Users className="w-4 h-4 mr-1" />
            <span>{auction.listing?.person_capacity || 1} guests</span>
            <span className="mx-2">•</span>
            <Calendar className="w-4 h-4 mr-1" />
            <span>{auction.total_nights || 'N/A'} nights</span>
          </div>
        </div>

        {/* Photo Gallery */}
        {images.length > 0 && (
          <div className="mb-12">
            <PlaceGallery photos={images} />
          </div>
        )}

        {/* Connection Status & Notifications */}
        <div className="mb-8 space-y-3">
          {/* Connection Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  hasError ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {isConnected ? 'Live Updates Active' :
                     connectionStatus === 'connecting' ? 'Connecting...' :
                     hasError ? 'Connection Error' : 'Not Connected'}
                  </span>
                  {isConnected && (
                    <p className="text-xs text-gray-500">Real-time bid updates enabled</p>
                  )}
                </div>
              </div>
              {hasError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>

          {/* Live Notifications */}
          {notifications.length > 0 && (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${
                    notification.type === 'bid' ? 'border-blue-500 bg-blue-50' :
                    notification.type === 'auction_ended' ? 'border-green-500 bg-green-50' :
                    'border-gray-500 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {notification.type === 'bid' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                      {notification.type === 'auction_ended' && <Award className="w-5 h-5 text-green-600" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Auction Host Info */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Auction: {auction.listing?.room_type || 'Property'}
                  </h2>
                  <div className="flex items-center text-gray-600 text-sm space-x-4">
                    <span>{auction.listing?.person_capacity || 1} guests</span>
                    <span>•</span>
                    <span>{auction.total_nights || 'N/A'} nights</span>
                    <span>•</span>
                    <span>{auction.bid_count || 0} bids</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Gavel className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Auction Features */}
            <div className="border-b border-gray-200 pb-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Timer className="w-6 h-6 text-rose-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Time Remaining</h3>
                    <p className={`text-sm ${isAuctionActive ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {getTimeRemainingText()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <TrendingUp className="w-6 h-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Current Bid</h3>
                    <p className="text-sm text-gray-600">
                      {formatVND(auction.current_bid)} from {auction.bid_count || 0} bids
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Instant Buy Available</h3>
                    <p className="text-sm text-gray-600">
                      Skip bidding and buy now for {formatVND(auction.buyout_price)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About this property</h2>
              <div className="text-gray-700 leading-relaxed">
                <p>{auction.listing?.description || 'No description available.'}</p>
              </div>
            </div>

            {/* Auction Timeline */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Auction & Stay Timeline</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auction Timeline */}
                <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center mr-3">
                      <Gavel className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-rose-900">Auction Phase</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-rose-700">Auction ends:</span>
                      <span className="font-medium text-rose-900">{formatDate(auction.auction_end)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-rose-700">Time remaining:</span>
                      <span className={`font-bold ${isAuctionActive ? 'text-red-600' : 'text-gray-500'}`}>
                        {getTimeRemainingText()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-rose-700">Total bids:</span>
                      <span className="font-medium text-rose-900">{auction.bid_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Accommodation Timeline */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-900">Stay Details</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Check-in:</span>
                      <span className="font-medium text-green-900">
                        {auction.check_in_date ? formatDate(auction.check_in_date) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Check-out:</span>
                      <span className="font-medium text-green-900">
                        {auction.check_out_date ? formatDate(auction.check_out_date) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Duration:</span>
                      <span className="font-medium text-green-900">{auction.total_nights || 'N/A'} nights</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            {auction.listing?.city && (
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Where you'll stay</h2>
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">{auction.listing.city}</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Explore the area and discover local attractions, restaurants, and activities during your stay.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Bidding Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Bidding Widget */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm mb-3 ${
                    isAuctionActive 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                      : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                  }`}>
                    <Gavel className="w-4 h-4 mr-2" />
                    {isAuctionActive ? 'LIVE AUCTION' : 'AUCTION ENDED'}
                  </div>
                  <div className={`text-xs font-medium ${
                    isAuctionActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {getTimeRemainingText()}
                  </div>
                </div>

                {/* Current Bid Display */}
                <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 border-2 border-rose-200 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center mr-3">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-rose-900">Current High Bid</span>
                    </div>
                    {auction.bid_count > 0 && (
                      <div className="flex items-center text-rose-600">
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">{auction.bid_count} bids</span>
                      </div>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-rose-900 mb-2">
                    {formatVND(auction.current_bid)}
                  </div>
                  {auction.bid_count === 0 ? (
                    <p className="text-xs text-rose-600">No bids yet - be the first!</p>
                  ) : (
                    <p className="text-xs text-rose-700">
                      {auction.bid_count} {auction.bid_count === 1 ? 'bid' : 'bids'} placed
                    </p>
                  )}
                </div>

                {/* Price Comparison */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Starting Price</div>
                    <div className="text-sm font-medium text-gray-400 line-through">
                      {formatVND(auction.starting_price)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-600 font-medium mb-1 flex items-center justify-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Buy Now
                    </div>
                    <div className="text-sm font-bold text-green-700">
                      {formatVND(auction.buyout_price)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {user && isAuctionActive ? (
                  <div className="space-y-3">
                    <Link
                      to={`/auctions/${auction._id}/bid`}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Gavel className="w-5 h-5 mr-2" />
                      Place Bid
                    </Link>
                    {auction.current_bid < auction.buyout_price ? (
                      <Link
                        to={`/auctions/${auction._id}/buyout`}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Buy Now
                      </Link>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-400 text-white font-semibold rounded-xl cursor-not-allowed opacity-60">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Buy Now Unavailable
                      </div>
                    )}
                  </div>
                ) : !user ? (
                  <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Gavel className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Login to participate</p>
                    <p className="text-xs text-gray-600 mb-4">Join the auction and place your bids</p>
                    <Link 
                      to="/login" 
                      className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
                    >
                      Login Now
                    </Link>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Auction has ended</p>
                    <p className="text-xs text-gray-600">Check back for new auctions</p>
                  </div>
                )}
              </div>

              {/* Recent Bids */}
              {(auction.bids?.length > 0 || recentBids.length > 0) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Bid History</h3>
                    {isConnected && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-xs font-medium text-green-600">Live Updates</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Show real-time bids first */}
                    {recentBids.slice(0, 3).map((bid, index) => (
                      <div key={`live-${bid.bidder_id}-${bid.timestamp}`} className="relative">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="font-medium text-gray-900">{bid.bidder_name}</span>
                                <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full animate-pulse">NEW</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(bid.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-blue-900">{formatVND(bid.bid_amount)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show original bids */}
                    {auction.bids?.slice(0, Math.max(0, 5 - recentBids.length)).map((bid, index) => (
                      <div key={bid._id || index} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex justify-between items-start py-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {bid.bidder?.name || 'Anonymous Bidder'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(bid.bid_time).toLocaleDateString()} at {new Date(bid.bid_time).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{formatVND(bid.bid_amount)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {auction.bids?.length === 0 && recentBids.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Gavel className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No bids yet</p>
                        <p className="text-xs text-gray-400 mt-1">Be the first to place a bid!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Report Auction */}
              <div className="text-center mt-6">
                <button className="text-gray-600 hover:text-gray-900 text-sm underline transition-colors">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Report this auction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;