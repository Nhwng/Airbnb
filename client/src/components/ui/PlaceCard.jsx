import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import axiosInstance from '@/utils/axios';
import { MapPin, Users, Star } from 'lucide-react';

const DEFAULT_IMAGE_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';

// Helper function to extract actual ID from complex MongoDB Int64 format
const extractListingId = (listing_id) => {
  if (typeof listing_id === 'object' && listing_id !== null) {
    if (listing_id.low !== undefined && listing_id.high !== undefined) {
      // MongoDB Int64 format - handle negative numbers correctly
      if (listing_id.unsigned === false && listing_id.high < 0) {
        // Handle negative high values
        return listing_id.low + (listing_id.high * Math.pow(2, 32));
      } else {
        // Handle positive values or unsigned
        return (listing_id.low >>> 0) + (listing_id.high * Math.pow(2, 32));
      }
    } else if (listing_id._id) {
      return listing_id._id;
    } else {
      return listing_id.toString();
    }
  }
  return listing_id;
};

const PlaceCard = ({ place, images }) => {
  const { listing_id, title, nightly_price, city, person_capacity, firstImage } = place;
  
  // Extract the actual ID from MongoDB Int64 format
  const placeId = extractListingId(listing_id);
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use actual database image if available, otherwise fallback to placeholder
  let selectedImage = null;
  
  if (firstImage && firstImage.url) {
    // Use actual database image
    selectedImage = {
      url: firstImage.url,
      caption: firstImage.caption || `${title} - Property Image`
    };
  } else {
    // Fallback to curated placeholder images if no database image
    const placeholderImages = [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
    ];
    
    const imageIndex = Math.abs(placeId) % placeholderImages.length;
    selectedImage = {
      url: placeholderImages[imageIndex],
      caption: `${title} - Property Image`
    };
  }

  // Check if listing is favorited on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !placeId) return;
      
      try {
        const { data } = await axiosInstance.get(`/favorites/check/${placeId}`);
        setIsFavorited(data.isFavorited);
      } catch (error) {
        // Silently fail if user is not authenticated or API is not available
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          console.warn('Error checking favorite status:', error.message);
        }
      }
    };
    
    checkFavoriteStatus();
  }, [placeId, user]);

  const handleFavoriteClick = async (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    
    if (!user || !placeId) {
      return;
    }

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
      // Silently fail if user is not authenticated or API is not available
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.warn('Error toggling favorite:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link 
      to={`/listing/${placeId}`} 
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
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {title}
          </h3>
          <div className="flex items-center ml-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">4.8</span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{city || 'Unknown City'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span className="text-sm">{person_capacity || 1} guests</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              ₫{nightly_price?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500">per night</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlaceCard;
