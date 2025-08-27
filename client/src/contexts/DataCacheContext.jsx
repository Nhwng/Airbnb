import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance from '@/utils/axios';

const DataCacheContext = createContext();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const DataCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});

  // Helper to check if cache entry is still valid
  const isCacheValid = useCallback((cacheKey) => {
    const entry = cache[cacheKey];
    return entry && (Date.now() - entry.timestamp) < CACHE_DURATION;
  }, [cache]);

  // Generic cache getter with automatic API fetching
  const getCachedData = useCallback(async (cacheKey, fetchFn) => {
    // Return cached data if valid
    if (isCacheValid(cacheKey)) {
      console.log(`📦 Cache hit for: ${cacheKey}`);
      return cache[cacheKey].data;
    }

    // Prevent multiple simultaneous requests for same data
    if (loading[cacheKey]) {
      console.log(`⏳ Waiting for ongoing request: ${cacheKey}`);
      return new Promise((resolve, reject) => {
        const checkCache = () => {
          if (cache[cacheKey] && !loading[cacheKey]) {
            resolve(cache[cacheKey].data);
          } else if (!loading[cacheKey]) {
            reject(new Error(`Request failed for ${cacheKey}`));
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Fetch fresh data
    console.log(`🌐 Cache miss, fetching: ${cacheKey}`);
    setLoading(prev => ({ ...prev, [cacheKey]: true }));
    
    try {
      const data = await fetchFn();
      
      // Store in cache with timestamp
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          data,
          timestamp: Date.now()
        }
      }));
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching ${cacheKey}:`, error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [cache, loading, isCacheValid]);

  // Homepage data cache
  const getHomepageData = useCallback(async () => {
    return getCachedData('homepage_data', async () => {
      console.log('🏠 Fetching fresh homepage data...');
      
      // Fetch catalog first
      const { data: catalogData } = await axiosInstance.get('/listings/catalog');
      const { homeTypes: allHomeTypes = [], cities = [] } = catalogData || {};
      
      // Top 3 home types for sections
      const selectedHomeTypes = allHomeTypes.slice(0, 3);
      
      // Fetch listings for each home type in parallel
      const homeTypePromises = selectedHomeTypes.map(async (ht) => {
        try {
          const { data: byType } = await axiosInstance.get(
            `/listings/by-home-type?homeType=${encodeURIComponent(ht.name)}&limit=4&withImages=true`
          );
          return {
            name: ht.name,
            listings: (byType || []).map((l) => ({
              ...l,
              images: l.firstImage ? [l.firstImage] : [],
            }))
          };
        } catch (err) {
          console.error(`Error loading listings for ${ht.name}:`, err);
          return {
            name: ht.name,
            listings: []
          };
        }
      });
      
      const homeTypeResults = await Promise.all(homeTypePromises);
      const homeTypeListings = homeTypeResults.reduce((acc, result) => {
        acc[result.name] = result.listings;
        return acc;
      }, {});
      
      // Also fetch city listings if needed
      let cityListings = [];
      try {
        const { data: cityData } = await axiosInstance.get('/listings?limit=8&withImages=true');
        cityListings = (cityData || []).map((l) => ({
          ...l,
          images: l.firstImage ? [l.firstImage] : [],
        }));
      } catch (err) {
        console.error('Error loading city listings:', err);
      }
      
      return {
        catalog: { cities, homeTypes: allHomeTypes },
        selectedHomeTypes,
        homeTypeListings,
        cityListings
      };
    });
  }, [getCachedData]);

  // Listings cache for specific searches
  const getCachedListings = useCallback(async (searchParams) => {
    const cacheKey = `listings_${JSON.stringify(searchParams)}`;
    return getCachedData(cacheKey, async () => {
      const { data } = await axiosInstance.get('/listings', { params: searchParams });
      return data;
    });
  }, [getCachedData]);

  // City-specific listings cache
  const getCachedCityListings = useCallback(async (cityName, limit = 12) => {
    const cacheKey = `city_listings_${cityName}_${limit}`;
    return getCachedData(cacheKey, async () => {
      const { data } = await axiosInstance.get(
        `/listings/search?city=${encodeURIComponent(cityName)}&limit=${limit}&withImages=true`
      );
      return data;
    });
  }, [getCachedData]);

  // Home type listings cache
  const getCachedHomeTypeListings = useCallback(async (typeName, subtypeName, limit = 12) => {
    const cacheKey = `hometype_listings_${typeName}_${subtypeName || 'all'}_${limit}`;
    return getCachedData(cacheKey, async () => {
      const params = new URLSearchParams({ homeType: typeName, limit: limit.toString() });
      if (subtypeName) params.append('subtype', subtypeName);

      // Prefer /by-home-type; fallback to /search
      try {
        const { data } = await axiosInstance.get(`/listings/by-home-type?${params.toString()}`);
        return data;
      } catch (e) {
        console.warn('by-home-type failed, fallback to /listings/search', e);
        const searchParams = new URLSearchParams({
          withImages: 'true',
          limit: limit.toString(),
          homeType: typeName,
        });
        if (subtypeName) searchParams.append('subtype', subtypeName);
        
        const { data } = await axiosInstance.get(`/listings/search?${searchParams.toString()}`);
        return data;
      }
    });
  }, [getCachedData]);

  // Favorites cache (updated to work with our optimized API)
  const getCachedFavorites = useCallback(async (page = 1, limit = 12) => {
    const cacheKey = `favorites_${page}_${limit}`;
    return getCachedData(cacheKey, async () => {
      const { data } = await axiosInstance.get(`/favorites?page=${page}&limit=${limit}&include_images=true`);
      return data;
    });
  }, [getCachedData]);

  // Reservations cache (updated to work with our optimized API)
  const getCachedReservations = useCallback(async (page = 1, limit = 10) => {
    const cacheKey = `reservations_${page}_${limit}`;
    return getCachedData(cacheKey, async () => {
      const { data } = await axiosInstance.get(`/reservations?page=${page}&limit=${limit}&include_images=true`);
      return data;
    });
  }, [getCachedData]);

  // Auctions cache
  const getCachedAuctions = useCallback(async (page = 1, limit = 12, filters = {}) => {
    const cacheKey = `auctions_${JSON.stringify({ ...filters, page, limit })}`;
    return getCachedData(cacheKey, async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.searchQuery && { search: filters.searchQuery })
      });
      
      const { data } = await axiosInstance.get(`/auctions?${params.toString()}`);
      return data;
    });
  }, [getCachedData]);

  // Cache invalidation helpers
  const invalidateCache = useCallback((cacheKey) => {
    console.log(`🗑️ Invalidating cache: ${cacheKey}`);
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
  }, []);

  const invalidateAllCache = useCallback(() => {
    console.log('🗑️ Invalidating all cache');
    setCache({});
  }, []);

  // Invalidate cache patterns (for when user makes changes)
  const invalidateFavoritesCache = useCallback(() => {
    Object.keys(cache).forEach(key => {
      if (key.startsWith('favorites_')) {
        invalidateCache(key);
      }
    });
  }, [cache, invalidateCache]);

  const invalidateReservationsCache = useCallback(() => {
    Object.keys(cache).forEach(key => {
      if (key.startsWith('reservations_')) {
        invalidateCache(key);
      }
    });
  }, [cache, invalidateCache]);

  const invalidateListingsCache = useCallback(() => {
    Object.keys(cache).forEach(key => {
      if (key.startsWith('listings_') || key.startsWith('city_listings_') || key.startsWith('hometype_listings_')) {
        invalidateCache(key);
      }
    });
  }, [cache, invalidateCache]);

  const invalidateAuctionsCache = useCallback(() => {
    Object.keys(cache).forEach(key => {
      if (key.startsWith('auctions_') || key.startsWith('auction_detail_')) {
        invalidateCache(key);
      }
    });
  }, [cache, invalidateCache]);

  // Clear expired cache entries periodically
  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    setCache(prev => {
      const newCache = {};
      let expiredCount = 0;
      
      Object.entries(prev).forEach(([key, entry]) => {
        if ((now - entry.timestamp) < CACHE_DURATION) {
          newCache[key] = entry;
        } else {
          expiredCount++;
        }
      });
      
      if (expiredCount > 0) {
        console.log(`🧹 Cleaned up ${expiredCount} expired cache entries`);
      }
      
      return newCache;
    });
  }, []);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(clearExpiredCache, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [clearExpiredCache]);

  const value = {
    // Data getters
    getHomepageData,
    getCachedListings,
    getCachedCityListings,
    getCachedHomeTypeListings,
    getCachedFavorites,
    getCachedReservations,
    getCachedAuctions,
    getCachedData, // Generic caching function
    
    // Cache management
    invalidateCache,
    invalidateAllCache,
    invalidateFavoritesCache,
    invalidateReservationsCache,
    invalidateListingsCache,
    invalidateAuctionsCache,
    clearExpiredCache,
    
    // Cache info
    isCacheValid,
    cache,
    loading,
    
    // Stats for debugging
    getCacheStats: () => ({
      totalEntries: Object.keys(cache).length,
      validEntries: Object.keys(cache).filter(key => isCacheValid(key)).length,
      expiredEntries: Object.keys(cache).filter(key => !isCacheValid(key)).length,
      activeRequests: Object.keys(loading).filter(key => loading[key]).length
    })
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};

export default DataCacheProvider;