import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Users, Home, Star } from 'lucide-react';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';
import { useAuth } from '../../hooks';
import AccountNav from '@/components/ui/AccountNav';
import Spinner from '@/components/ui/Spinner';

const FavoritesPage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axiosInstance.get('/favorites');
        
        // Fetch images for each favorite listing
        const favoritesWithImages = await Promise.all(
          data.favorites.map(async (favorite) => {
            try {
              const imageRes = await axiosInstance.get(`/images/${favorite.listing_id.listing_id}`);
              return {
                ...favorite,
                images: imageRes.data || []
              };
            } catch (err) {
              return {
                ...favorite,
                images: []
              };
            }
          })
        );
        
        setFavorites(favoritesWithImages);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load your favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemoveFromFavorites = async (listingId) => {
    try {
      await axiosInstance.delete(`/favorites/${listingId}`);
      setFavorites(prev => prev.filter(fav => fav.listing_id.listing_id !== listingId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AccountNav />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-20 px-6">
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-rose-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Please log in to view your favorites</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Sign in to save your favorite places and access them anytime.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium space-x-2"
            >
              <Heart className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AccountNav />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-20 px-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Something went wrong</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium space-x-2"
            >
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AccountNav />
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Your Favorites</h1>
          <p className="text-gray-600">
            {favorites.length === 0 
              ? "Save properties you love and access them anytime" 
              : `${favorites.length} saved ${favorites.length === 1 ? 'property' : 'properties'}`
            }
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-20 px-6">
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-rose-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No favorites yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start exploring amazing places and save your favorites for easy access later.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Start Exploring</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => {
              const listing = favorite.listing_id;
              const firstImage = favorite.images?.length > 0 ? favorite.images[0] : null;
              
              return (
                <div
                  key={favorite._id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Property Image */}
                  <div className="relative h-48 overflow-hidden">
                    {firstImage ? (
                      <img 
                        src={firstImage.url} 
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Remove from favorites button */}
                    <button
                      onClick={() => handleRemoveFromFavorites(listing.listing_id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm group"
                      aria-label="Remove from favorites"
                    >
                      <Heart 
                        className="w-5 h-5 text-rose-600 fill-current" 
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title and Location */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {listing.title}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{listing.city}</span>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-700">
                        <Home className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-sm">{listing.room_type}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <Users className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-sm">
                          {listing.person_capacity} {listing.person_capacity === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <span className="font-semibold text-lg">{formatVND(listing.nightly_price)}</span>
                        <span className="text-gray-500 ml-1 text-sm">/ night</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100">
                      <Link
                        to={`/listing/${listing.listing_id}`}
                        className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center"
                      >
                        View Property
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;