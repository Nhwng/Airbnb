import { useState, useEffect, useCallback } from 'react';
import { useListings } from '../../hooks';
import axiosInstance from '@/utils/axios';

import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';
import SearchBar from '@/components/ui/SearchBar';
import { Home, ChevronDown } from 'lucide-react';


// Results Summary Component
const ResultsSummary = ({ count, onClearFilters, showFilters, setShowFilters }) => {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          {count > 0 ? `${count} stays available` : 'No stays found'}
        </h2>
        <p className="text-gray-600">
          {count > 0 ? 'Choose from our selection of accommodations' : 'Try adjusting your search or filters'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Filters
        </button>
        {showFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-600 hover:text-black underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

// Main Index Page Component
const IndexPage = () => {
  // Use the global listings context instead of local state
  const { listings, images, loading, setLoading, isSearching, resetToDefault, setListings } = useListings();
  
  
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [localImages, setLocalImages] = useState({});
  const [currentSearchParams, setCurrentSearchParams] = useState(null);

  // Load initial featured listings with images - FIXED
  const loadFeaturedListings = useCallback(async () => {
    console.log('🚀 loadFeaturedListings called, initialLoad:', initialLoad);
    if (!initialLoad) {
      console.log('❌ Skipping loadFeaturedListings - not initial load');
      return; // Prevent reloading if already loaded
    }
    
    console.log('✅ Starting loadFeaturedListings...');
    setLoading(true);
    try {
      // Load featured listings for homepage with image filtering
      console.log('📡 Making API call to /listings?limit=8&featured=true&withImages=true');
      const { data: listingsData } = await axiosInstance.get('/listings?limit=8&featured=true&withImages=true');
      console.log('🔍 API returned listings:', listingsData.length);
      console.log('📄 First listing:', listingsData[0]?.title);
      
      // No need to load images separately - they're included in the response as firstImage
      // FIXED: Don't convert listing IDs since API now returns consistent format
      const listingsWithImages = listingsData.map(listing => {
        console.log(`📦 Processing listing ${listing.listing_id}:`, listing.title?.substring(0, 30));
        console.log(`🖼️ Has firstImage:`, !!listing.firstImage);
        
        return {
          ...listing,
          images: listing.firstImage ? [listing.firstImage] : []
        };
      });
      
      // Create a proper images object mapping
      const imagesMap = {};
      listingsWithImages.forEach(listing => {
        if (listing.images && listing.images.length > 0) {
          imagesMap[listing.listing_id] = listing.images;
          console.log(`🗺️ Added to imagesMap: ${listing.listing_id} -> ${listing.images.length} images`);
        } else {
          console.log(`❌ No images for listing ${listing.listing_id}: ${listing.title?.substring(0, 30)}`);
        }
      });
      
      console.log('📋 Final imagesMap:', Object.keys(imagesMap).length, 'entries');
      // Set both listings and images
      setListings(listingsWithImages);
      setLocalImages(imagesMap);
      console.log('🎉 Successfully loaded listings and images');
      
    } catch (error) {
      console.error('💥 Error loading featured listings:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    setLoading(false);
    setInitialLoad(false);
  }, [initialLoad, setLoading, setListings]);
  
  // Handle search from SearchBar component
  const handleSearch = useCallback(async (searchData) => {
    setSearchActive(true);
    setLoading(true);
    setCurrentPage(1);
    
    try {
      const searchParams = new URLSearchParams({
        city: searchData.city,
        guests: searchData.guests.toString(),
        limit: '12',
        withImages: 'true'
      });
      
      // Store search parameters for pagination
      setCurrentSearchParams(searchParams);
      
      const { data: searchResults } = await axiosInstance.get(`/listings/search?${searchParams}`);
      
      // Process results same way as featured listings
      const processedResults = searchResults.map(listing => ({
        ...listing,
        images: listing.firstImage ? [listing.firstImage] : []
      }));
      
      // Create images map
      const imagesMap = {};
      processedResults.forEach(listing => {
        if (listing.images && listing.images.length > 0) {
          imagesMap[listing.listing_id] = listing.images;
        }
      });
      
      setListings(processedResults);
      setLocalImages(imagesMap);
      setHasMore(searchResults.length >= 12);
      
    } catch (error) {
      console.error('💥 Search error:', error);
      setListings([]);
      setLocalImages({});
    }
    setLoading(false);
  }, [setLoading, setListings]);


  // Load more listings (View More functionality) 
  const loadMoreListings = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      let apiUrl;
      
      if (searchActive && currentSearchParams) {
        // Use stored search parameters for pagination
        const paginationParams = new URLSearchParams(currentSearchParams);
        paginationParams.set('limit', '12');
        paginationParams.set('offset', ((nextPage - 1) * 12).toString());
        apiUrl = `/listings/search?${paginationParams}`;
      } else {
        // Default homepage listings with image filtering
        apiUrl = `/listings/homepage-listings?limit=12&offset=${(nextPage - 1) * 12}&withImages=true`;
      }
      
      const { data: moreListings } = await axiosInstance.get(apiUrl);
      
      console.log(`📄 Loading page ${nextPage}, found ${moreListings.length} more listings`);
      
      if (moreListings.length > 0) {
        // Process new listings
        const processedListings = moreListings.map(listing => ({
          ...listing,
          images: listing.firstImage ? [listing.firstImage] : []
        }));
        
        // Create images map for new listings
        const newImagesMap = {};
        processedListings.forEach(listing => {
          if (listing.images && listing.images.length > 0) {
            newImagesMap[listing.listing_id] = listing.images;
          }
        });
        
        // Append to existing listings
        setListings(prev => [...prev, ...processedListings]);
        setLocalImages(prev => ({ ...prev, ...newImagesMap }));
        setCurrentPage(nextPage);
        setHasMore(moreListings.length >= 12);
      } else {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('💥 Load more error:', error);
      setHasMore(false);
    }
    setLoading(false);
  }, [loading, hasMore, currentPage, searchActive, currentSearchParams, setLoading, setListings]);

  // Handle filter changes
  const handleFiltersChange = useCallback(async (newFilters) => {
    setCurrentFilters(newFilters);
    
    const hasActiveFilters = 
      newFilters.priceRange[0] !== 100000 || 
      newFilters.priceRange[1] !== 4000000 ||
      newFilters.selectedCities.length > 0 ||
      newFilters.selectedHomeTypes.length > 0 ||
      newFilters.guests !== 1;

    if (hasActiveFilters) {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        
        // Add current filters
        if (newFilters.selectedCities.length > 0) {
          searchParams.append('city', newFilters.selectedCities.join(','));
        }
        if (newFilters.priceRange[0] !== 100000) {
          searchParams.append('minPrice', newFilters.priceRange[0]);
        }
        if (newFilters.priceRange[1] !== 4000000) {
          searchParams.append('maxPrice', newFilters.priceRange[1]);
        }
        if (newFilters.guests > 1) {
          searchParams.append('guests', newFilters.guests);
        }
        if (newFilters.selectedHomeTypes.length > 0) {
          searchParams.append('roomType', newFilters.selectedHomeTypes.join(','));
        }
        
        // Limit filtered results to 12 items and only show listings with images
        searchParams.append('limit', '12');
        searchParams.append('withImages', 'true');

        const { data: searchResults } = await axiosInstance.get(`/listings?${searchParams}`);
        
        // Process results same way as featured listings and search - use firstImage from API
        const processedResults = searchResults.map(listing => ({
          ...listing,
          images: listing.firstImage ? [listing.firstImage] : []
        }));
        
        // Create images map
        const imagesMap = {};
        processedResults.forEach(listing => {
          if (listing.images && listing.images.length > 0) {
            imagesMap[listing.listing_id] = listing.images;
          }
        });
        
        // Update both listings and images
        setListings(processedResults);
        setLocalImages(imagesMap);
        
      } catch (error) {
        console.error('Error filtering listings:', error);
      }
      setLoading(false);
    } else if (resetToDefault) {
      resetToDefault();
    } else {
      loadFeaturedListings();
    }
  }, [setLoading, resetToDefault, loadFeaturedListings, setListings]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setShowFilters(false);
    setCurrentFilters({
      priceRange: [100000, 4000000],
      selectedCities: [],
      selectedHomeTypes: [],
      guests: 1
    });
    if (resetToDefault) {
      resetToDefault();
    } else {
      loadFeaturedListings();
    }
  }, [resetToDefault, loadFeaturedListings]);

  // Load featured listings on component mount
  useEffect(() => {
    console.log('📊 useEffect check - initialLoad:', initialLoad, 'listings.length:', listings?.length, 'isSearching:', isSearching);
    // Only load if we don't have listings from search or if it's the initial load
    if (initialLoad && (!listings || listings.length === 0) && !isSearching) {
      console.log('✅ Conditions met - calling loadFeaturedListings');
      loadFeaturedListings();
    } else {
      console.log('❌ Conditions not met for loadFeaturedListings');
      console.log('  - initialLoad:', initialLoad);
      console.log('  - listings empty:', (!listings || listings.length === 0));
      console.log('  - not searching:', !isSearching);
    }
  }, [listings, isSearching, initialLoad, loadFeaturedListings]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search Bar */}
      <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Find your perfect stay
            </h1>
            <p className="text-xl md:text-2xl text-rose-100 max-w-3xl mx-auto">
              Discover amazing accommodations in Vietnam's most beautiful destinations
            </p>
          </div>
          
          {/* Sticky Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar 
              onSearch={handleSearch}
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {searchActive ? 'Search Results' : 'Featured Stays'}
          </h2>
          <p className="text-gray-600">
            {listings?.length || 0} {searchActive ? 'results found' : 'amazing places to stay'}
          </p>
        </div>

        {/* Loading State */}
        {loading && currentPage === 1 && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {/* Listings Grid - Responsive */}
        {listings && listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {listings.map(listing => (
                <PlaceCard
                  key={listing._id || listing.listing_id}
                  place={listing}
                  images={localImages[listing.listing_id] || []}
                />
              ))}
            </div>

            {/* View More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMoreListings}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading && currentPage > 1 ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      View More
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {searchActive ? 'No results found' : 'No accommodations available'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchActive 
                ? 'Try adjusting your search criteria or search in a different city.' 
                : 'Check back later for new listings.'}
            </p>
            {searchActive && (
              <button
                onClick={() => {
                  setSearchActive(false);
                  loadFeaturedListings();
                }}
                className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium"
              >
                View Featured Stays
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexPage;