import { useState, useEffect, useCallback } from 'react';
import { useListings } from '../../hooks';
import axiosInstance from '@/utils/axios';

import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';
import SearchBar from '@/components/ui/SearchBar';
import { Home, ChevronDown, ArrowRight, MapPin } from 'lucide-react';

// Home Type Section Component
const HomeTypeSection = ({ homeType, listings }) => {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {homeType.name}
        </h2>
        {homeType.description && (
          <p className="text-gray-600">{homeType.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map(listing => (
          <PlaceCard
            key={listing._id || listing.listing_id}
            place={listing}
            images={listing.images || []}
          />
        ))}
      </div>
    </div>
  );
};

// City Section Component
const CitySection = ({ cityName, listings }) => {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-rose-600" />
          Explore {cityName}
        </h2>
        <p className="text-gray-600">Discover amazing accommodations in {cityName}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map(listing => (
          <PlaceCard
            key={listing._id || listing.listing_id}
            place={listing}
            images={listing.images || []}
          />
        ))}
      </div>
    </div>
  );
};

// Main Index Page Component
const IndexPage = () => {
  // Use the global listings context instead of local state
  const { listings, setLoading, setListings } = useListings();
  
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [homeTypes, setHomeTypes] = useState([]);
  const [homeTypeListings, setHomeTypeListings] = useState({});
  const [cityListings, setCityListings] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Load homepage data with sections
  const loadHomepageData = useCallback(async () => {
    console.log('🚀 loadHomepageData called, initialLoad:', initialLoad);
    if (!initialLoad) {
      console.log('❌ Skipping loadHomepageData - not initial load');
      return;
    }
    
    console.log('✅ Starting loadHomepageData...');
    setCatalogLoading(true);
    try {
      // Load catalog data (home types and cities)
      const { data: catalogData } = await axiosInstance.get('/listings/catalog');
      console.log('🏠 Catalog data:', catalogData);
      
      const { homeTypes: allHomeTypes, cities } = catalogData;
      
      // Take first 3 home types
      const selectedHomeTypes = allHomeTypes.slice(0, 3);
      setHomeTypes(selectedHomeTypes);
      
      // Load listings for each home type
      const homeTypeListingsData = {};
      for (const homeType of selectedHomeTypes) {
        try {
          console.log(`📡 Loading listings for home type: ${homeType.name}`);
          const { data: listings } = await axiosInstance.get(`/listings/by-home-type?homeType=${encodeURIComponent(homeType.name)}&limit=4`);
          
          // Process listings with images
          const processedListings = listings.map(listing => ({
            ...listing,
            images: listing.firstImage ? [listing.firstImage] : []
          }));
          
          homeTypeListingsData[homeType.name] = processedListings;
          console.log(`✅ Loaded ${processedListings.length} listings for ${homeType.name}`);
        } catch (error) {
          console.error(`Error loading listings for ${homeType.name}:`, error);
          homeTypeListingsData[homeType.name] = [];
        }
      }
      setHomeTypeListings(homeTypeListingsData);
      
      // Load Ho Chi Minh City listings
      try {
        console.log('📡 Loading Ho Chi Minh City listings');
        const { data: hcmListings } = await axiosInstance.get('/listings/search?city=Ho%20Chi%20Minh%20City&limit=4&withImages=true');
        
        const processedCityListings = hcmListings.map(listing => ({
          ...listing,
          images: listing.firstImage ? [listing.firstImage] : []
        }));
        
        setCityListings(processedCityListings);
        console.log(`✅ Loaded ${processedCityListings.length} listings for Ho Chi Minh City`);
      } catch (error) {
        console.error('Error loading Ho Chi Minh City listings:', error);
        setCityListings([]);
      }
      
    } catch (error) {
      console.error('💥 Error loading homepage data:', error);
    }
    setCatalogLoading(false);
    setInitialLoad(false);
  }, [initialLoad]);
  
  // Handle search from SearchBar component
  const handleSearch = useCallback(async (searchData) => {
    setSearchActive(true);
    setLoading(true);
    
    try {
      const searchParams = new URLSearchParams({
        city: searchData.city,
        guests: searchData.guests.toString(),
        limit: '12',
        withImages: 'true'
      });

      // Add price filters if provided
      if (searchData.minPrice) {
        searchParams.append('minPrice', searchData.minPrice);
      }
      if (searchData.maxPrice) {
        searchParams.append('maxPrice', searchData.maxPrice);
      }
      
      // Add date filters if provided
      if (searchData.checkin) {
        searchParams.append('checkin', searchData.checkin);
      }
      if (searchData.checkout) {
        searchParams.append('checkout', searchData.checkout);
      }
      
      const { data: searchResults } = await axiosInstance.get(`/listings/search?${searchParams}`);
      
      // Process results same way as homepage listings
      const processedResults = searchResults.map(listing => ({
        ...listing,
        images: listing.firstImage ? [listing.firstImage] : []
      }));
      
      setListings(processedResults);
      
    } catch (error) {
      console.error('💥 Search error:', error);
      setListings([]);
    }
    setLoading(false);
  }, [setLoading, setListings]);

  // Load homepage data on component mount
  useEffect(() => {
    console.log('📊 useEffect check - initialLoad:', initialLoad, 'searchActive:', searchActive);
    if (initialLoad && !searchActive) {
      console.log('✅ Conditions met - calling loadHomepageData');
      loadHomepageData();
    } else {
      console.log('❌ Conditions not met for loadHomepageData');
    }
  }, [initialLoad, searchActive, loadHomepageData]);

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
        {/* Search Results or Homepage Sections */}
        {searchActive ? (
          <>
            {/* Results Header */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Search Results
              </h2>
              <p className="text-gray-600">
                {listings?.length || 0} results found
              </p>
            </div>

            {/* Search Results Grid */}
            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {listings.map(listing => (
                  <PlaceCard
                    key={listing._id || listing.listing_id}
                    place={listing}
                    images={listing.images || []}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Home className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  No results found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try adjusting your search criteria or search in a different city.
                </p>
                <button
                  onClick={() => {
                    setSearchActive(false);
                  }}
                  className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium"
                >
                  Back to Homepage
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Homepage Sections */}
            {catalogLoading ? (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            ) : (
              <>
                {/* Home Type Sections */}
                {homeTypes.map((homeType) => (
                  homeTypeListings[homeType.name] && homeTypeListings[homeType.name].length > 0 && (
                    <HomeTypeSection
                      key={homeType._id}
                      homeType={homeType}
                      listings={homeTypeListings[homeType.name]}
                    />
                  )
                ))}
                
                {/* Ho Chi Minh City Section */}
                {cityListings.length > 0 && (
                  <CitySection
                    cityName="Ho Chi Minh City"
                    listings={cityListings}
                  />
                )}
                
                {/* Show message if no data */}
                {homeTypes.length === 0 && cityListings.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16 px-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Home className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      No accommodations available
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Check back later for new listings.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IndexPage;