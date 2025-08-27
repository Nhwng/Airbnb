import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';
import { 
  MapPin, 
  Users, 
  Star, 
  Gavel, 
  Clock, 
  Timer,
  TrendingUp,
  Calendar,
  Zap
} from 'lucide-react';

const DEFAULT_IMAGE_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';

// Helper function to extract actual ID
const extractListingId = (listing_id) => {
  if (typeof listing_id === 'number' || typeof listing_id === 'string') {
    return listing_id;
  }
  
  if (typeof listing_id === 'object' && listing_id !== null) {
    if (listing_id._id) {
      return listing_id._id;
    }
    
    if (listing_id.low !== undefined && listing_id.high !== undefined) {
      console.warn('Encountered Int64 object - this should be filtered by backend:', listing_id);
      return null;
    }
    
    return listing_id.toString();
  }
  
  return listing_id;
};

const AuctionCard = ({ auction }) => {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Extract listing data
  const listing = auction.listing || {};
  const { listing_id, title, city, person_capacity, firstImage } = listing;
  const placeId = extractListingId(listing_id);

  // Timer logic
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

  // Image handling
  let selectedImage = null;
  
  if (firstImage && firstImage.url) {
    selectedImage = {
      url: firstImage.url,
      caption: `${title} - Property Image`
    };
  } else {
    const placeholderImages = [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
    ];
    
    const imageIndex = Math.abs(placeId || 0) % placeholderImages.length;
    selectedImage = {
      url: placeholderImages[imageIndex],
      caption: `${title} - Property Image`
    };
  }

  // Check if listing is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !placeId) return;
      
      try {
        const { data } = await axiosInstance.get(`/favorites/check/${placeId}`);
        setIsFavorited(data.isFavorited);
      } catch (error) {
        // Silently fail
      }
    };
    
    checkFavoriteStatus();
  }, [placeId, user]);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !placeId) return;

    setIsLoading(true);
    
    try {
      if (isFavorited) {
        await axiosInstance.delete(`/favorites/${placeId}`);
        setIsFavorited(false);
      } else {
        await axiosInstance.post(`/favorites/${placeId}`);
        setIsFavorited(true);
      }
    } catch (error) {
      console.warn('Error toggling favorite:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
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
  const getDaysRemaining = () => timeRemaining?.days || 0;
  const getTotalNights = () => auction.total_nights || 'N/A';

  // Don't render if problematic ID
  if (placeId === null) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden opacity-50">
        <div className="p-4">
          <p className="text-gray-400">Auction unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <Link 
      to={`/auctions/${auction._id}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group block"
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={selectedImage?.url || DEFAULT_IMAGE_URL}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE_URL;
            }}
          />
        </div>
        
        {/* Auction Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
            isAuctionActive 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <Gavel className="w-3 h-3 mr-1.5" />
            {isAuctionActive ? 'LIVE AUCTION' : 'ENDED'}
          </div>
        </div>

        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white/90 transition-colors shadow-sm disabled:opacity-50"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill={isFavorited ? "#FF385C" : "none"} 
              stroke={isFavorited ? "#FF385C" : "#222222"} 
              strokeWidth="2"
              className="transition-colors"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}

        {/* Time Remaining Badge */}
        <div className="absolute bottom-3 right-3">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            getDaysRemaining() > 0 
              ? 'bg-blue-500 text-white' 
              : 'bg-orange-500 text-white'
          }`}>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {getTimeRemainingText()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Title and Rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {title || 'Untitled Property'}
          </h3>
          <div className="flex items-center ml-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">4.8</span>
          </div>
        </div>
        
        {/* Location and Guests */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{city || 'Unknown City'}</span>
          <span className="mx-2">•</span>
          <Users className="w-4 h-4 mr-1" />
          <span className="text-sm">{person_capacity || 1} guests</span>
        </div>

        {/* Stay Duration */}
        <div className="flex items-center text-gray-600 mb-3">
          <Calendar className="w-4 h-4 mr-1" />
          <span className="text-sm">{getTotalNights()} nights</span>
          <span className="mx-2">•</span>
          <span className="text-sm">{auction.check_in_date ? formatDate(auction.check_in_date) : 'TBD'}</span>
        </div>
        
        {/* Pricing Section */}
        <div className="space-y-2 mb-3">
          {/* Current Bid */}
          <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
            <div>
              <div className="text-xs text-rose-600 font-medium mb-1">CURRENT BID</div>
              <div className="text-lg font-bold text-rose-900">{formatVND(auction.current_bid)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-rose-600">{auction.bid_count || 0} bids</div>
              <TrendingUp className="w-4 h-4 text-rose-500 mt-1 ml-auto" />
            </div>
          </div>

          {/* Price Comparison */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Starting</div>
              <div className="text-sm font-medium text-gray-400 line-through">
                {formatVND(auction.starting_price)}
              </div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
              <div className="text-xs text-green-600 flex items-center justify-center">
                <Zap className="w-3 h-3 mr-1" />
                Buyout
              </div>
              <div className="text-sm font-bold text-green-700">
                {formatVND(auction.buyout_price)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Indicator */}
        <div className={`text-center py-2 px-3 rounded-lg font-medium text-sm ${
          isAuctionActive 
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-gray-50 text-gray-500 border border-gray-200'
        }`}>
          {isAuctionActive ? '🔥 Place Your Bid' : '⏰ Auction Ended'}
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;