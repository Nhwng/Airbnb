import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import axiosInstance from '@/utils/axios';

const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/400x300?text=No+Image';

const PlaceCard = ({ place, images }) => {
  const { listing_id: placeId, title, nightly_price } = place;
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy đại 1 ảnh đầu tiên có cùng listing_id
  let selectedImage = null;
  if (Array.isArray(images)) {
    selectedImage = images.find((img) => img.listing_id === placeId);
  }

  // Check if listing is favorited on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) return;
      
      try {
        const { data } = await axiosInstance.get(`/favorites/check/${placeId}`);
        setIsFavorited(data.isFavorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkFavoriteStatus();
  }, [placeId, user]);

  const handleFavoriteClick = async (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    
    if (!user) {
      // Could redirect to login or show a message
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
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link to={`/listing/${placeId}`} className="m-4 flex flex-col md:m-2 xl:m-0">
      <div className="card relative">
        <img
          src={selectedImage?.url || DEFAULT_IMAGE_URL}
          className="h-4/5 w-full rounded-xl object-cover"
          alt="Listing"
        />
        
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
        
        <h2 className="truncate font-bold">{title}</h2>
        <div className="mt-1">
          <span className="font-semibold">₫{new Intl.NumberFormat('vi-VN').format(nightly_price)} </span>
          per night
        </div>
      </div>
    </Link>
  );
};

export default PlaceCard;
