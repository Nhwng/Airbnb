// src/pages/IndexPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useListings } from '../../hooks';
import axiosInstance from '@/utils/axios';

import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';
import SearchBar from '@/components/ui/SearchBar';
import { Home, MapPin } from 'lucide-react';

// ===== Catalog tile: ẢNH TRÊN + CHỮ DƯỚI (không overlay, không trùng nhãn) =====
const CatalogTile = ({ name, image }) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
    <div className="aspect-[4/3] w-full overflow-hidden">
      {/* dùng img trực tiếp để không phụ thuộc nội bộ CatalogItem */}
      <img
        src={image}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
    <div className="px-4 py-3">
      <div className="text-base font-semibold text-gray-900">{name}</div>
    </div>
  </div>
);

// ===== Home Type Section =====
const HomeTypeSection = ({ homeType, listings }) => {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{homeType.name}</h2>
        {homeType.description && <p className="text-gray-600">{homeType.description}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map((listing) => (
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

// ===== City Section =====
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
        {listings.map((listing) => (
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

// ===== Main Page =====
const IndexPage = () => {
  // Global listings context
  const { listings, setLoading, setListings } = useListings();

  // Page state
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchActive, setSearchActive] = useState(false);

  // Homepage sections data
  const [homeTypes, setHomeTypes] = useState([]); // top 3
  const [homeTypeListings, setHomeTypeListings] = useState({});
  const [cityListings, setCityListings] = useState([]);

  // Catalog (full) + loading
  const [catalog, setCatalog] = useState({ cities: [], homeTypes: [] });
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Catalog tabs
  const [activeCatalogTab, setActiveCatalogTab] = useState('cities'); // 'cities' | 'accommodationTypes'
  const [openTypeId, setOpenTypeId] = useState(null); // mobile dropdown toggle

  // ===== Helpers to run a search and switch to results =====
  const runSearchAndShow = useCallback(
    async (fetcher) => {
      setSearchActive(true);
      setLoading(true);
      try {
        const results = await fetcher();
        const processed = (results || []).map((l) => ({
          ...l,
          images: l.firstImage ? [l.firstImage] : [],
        }));
        setListings(processed);
      } catch (e) {
        console.error('Catalog navigation search error:', e);
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setListings]
  );

  const handleCityClick = useCallback(
    (cityName) => {
      runSearchAndShow(async () => {
        const { data } = await axiosInstance.get(
          `/listings/search?city=${encodeURIComponent(cityName)}&limit=12&withImages=true`
        );
        return data;
      });
    },
    [runSearchAndShow]
  );

  const handleTypeClick = useCallback(
    (typeName, subtypeName) => {
      runSearchAndShow(async () => {
        const params = new URLSearchParams({ homeType: typeName, limit: '12' });
        if (subtypeName) params.append('subtype', subtypeName);

        // Prefer /by-home-type; fallback to /search
        try {
          const { data } = await axiosInstance.get(`/listings/by-home-type?${params.toString()}`);
          return data;
        } catch (e) {
          console.warn('by-home-type failed, fallback to /listings/search', e);
          const searchParams = new URLSearchParams({
            withImages: 'true',
            limit: '12',
            homeType: typeName,
          });
          if (subtypeName) searchParams.append('subtype', subtypeName);
          const { data } = await axiosInstance.get(`/listings/search?${searchParams.toString()}`);
          return data;
        }
      });
    },
    [runSearchAndShow]
  );

  // ===== Load homepage data + full catalog =====
  const loadHomepageData = useCallback(async () => {
    if (!initialLoad) return;
    setCatalogLoading(true);
    try {
      // Catalog
      const { data: catalogData } = await axiosInstance.get('/listings/catalog');
      const { homeTypes: allHomeTypes = [], cities = [] } = catalogData || {};
      setCatalog({ cities, homeTypes: allHomeTypes });

      // Top 3 home types for sections
      const selectedHomeTypes = allHomeTypes.slice(0, 3);
      setHomeTypes(selectedHomeTypes);

      // Listings per selected home type
      const htMap = {};
      for (const ht of selectedHomeTypes) {
        try {
          const { data: byType } = await axiosInstance.get(
            `/listings/by-home-type?homeType=${encodeURIComponent(ht.name)}&limit=4`
          );
          htMap[ht.name] = (byType || []).map((l) => ({
            ...l,
            images: l.firstImage ? [l.firstImage] : [],
          }));
        } catch (err) {
          console.error(`Error loading listings for ${ht.name}:`, err);
          htMap[ht.name] = [];
        }
      }
      setHomeTypeListings(htMap);

      // Featured city: Ho Chi Minh City
      try {
        const { data: hcm } = await axiosInstance.get(
          '/listings/search?city=Ho%20Chi%20Minh%20City&limit=4&withImages=true'
        );
        setCityListings(
          (hcm || []).map((l) => ({ ...l, images: l.firstImage ? [l.firstImage] : [] }))
        );
      } catch (err) {
        console.error('Error loading HCMC listings:', err);
        setCityListings([]);
      }
    } catch (err) {
      console.error('Error loading homepage data:', err);
    } finally {
      setCatalogLoading(false);
      setInitialLoad(false);
    }
  }, [initialLoad]);

  // ===== SearchBar handler =====
  const handleSearch = useCallback(
    async (searchData) => {
      setSearchActive(true);
      setLoading(true);
      try {
        const params = new URLSearchParams({
          city: searchData.city,
          guests: String(searchData.guests),
          limit: '12',
          withImages: 'true',
        });
        if (searchData.minPrice) params.append('minPrice', searchData.minPrice);
        if (searchData.maxPrice) params.append('maxPrice', searchData.maxPrice);
        if (searchData.checkin) params.append('checkin', searchData.checkin);
        if (searchData.checkout) params.append('checkout', searchData.checkout);

        const { data } = await axiosInstance.get(`/listings/search?${params.toString()}`);
        const processed = (data || []).map((l) => ({
          ...l,
          images: l.firstImage ? [l.firstImage] : [],
        }));
        setListings(processed);
      } catch (error) {
        console.error('Search error:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setListings]
  );

  useEffect(() => {
    if (initialLoad && !searchActive) {
      loadHomepageData();
    }
  }, [initialLoad, searchActive, loadHomepageData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* === Hero + Search === */}
      <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Find your perfect stay</h1>
            <p className="text-xl md:text-2xl text-rose-100 max-w-3xl mx-auto">
              Discover amazing accommodations in Vietnam&apos;s most beautiful destinations
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} className="rounded-2xl shadow-2xl" />
          </div>
        </div>
      </div>

      {/* === Main === */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchActive ? (
          <>
            {/* Results Header */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Search Results</h2>
              <p className="text-gray-600">{listings?.length || 0} results found</p>
            </div>

            {/* Results Grid */}
            {listings?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {listings.map((l) => (
                  <PlaceCard key={l._id || l.listing_id} place={l} images={l.images || []} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Home className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No results found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try adjusting your search criteria or search in a different city.
                </p>
                <button
                  onClick={() => setSearchActive(false)}
                  className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium"
                >
                  Back to Homepage
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* === Catalog Tabs (2 cấp) === */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Popular with travelers from Vietnam
                  </h2>
                  <p className="text-gray-600">Browse by destination or type of stay</p>
                </div>

                <div className="inline-flex rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => setActiveCatalogTab('cities')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeCatalogTab === 'cities'
                        ? 'bg-white shadow border border-gray-200 text-rose-600'
                        : 'text-gray-700 hover:text-rose-600'
                    }`}
                  >
                    Cities
                  </button>
                  <button
                    onClick={() => setActiveCatalogTab('accommodationTypes')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeCatalogTab === 'accommodationTypes'
                        ? 'bg-white shadow border border-gray-200 text-rose-600'
                        : 'text-gray-700 hover:text-rose-600'
                    }`}
                  >
                    Accommodation Types
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {catalogLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : activeCatalogTab === 'cities' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {catalog.cities.map((city) => (
                    <button
                      key={city._id || city.name}
                      type="button"
                      onClick={() => handleCityClick(city.name)}
                      className="text-left"
                    >
                      <CatalogTile name={city.name} image={city.image} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {catalog.homeTypes.map((type) => {
                    const typeId = type._id || type.name;
                    const hasSub = Array.isArray(type.subtypes) && type.subtypes.length > 0;
                    const displayName =
                      type.name === 'Room Types' ? 'Rooms' : type.name || 'Type';
                    const displayImage = type.image || type.subtypes?.[0]?.image;

                    return (
                      <div
                        key={typeId}
                        className="relative group"
                        onMouseLeave={() => setOpenTypeId(null)}
                      >
                        {/* Parent type: click = search parent + toggle submenu on mobile */}
                        <button
                          type="button"
                          onClick={() => {
                            if (hasSub) setOpenTypeId((prev) => (prev === typeId ? null : typeId));
                            handleTypeClick(type.name);
                          }}
                          className="w-full text-left"
                          onFocus={() => hasSub && setOpenTypeId(typeId)}
                        >
                          <CatalogTile name={displayName} image={displayImage} />
                        </button>

                        {/* Subtypes dropdown (hover desktop + toggle mobile) */}
                        {hasSub && (
                          <div
                            className={`absolute top-full left-0 w-full z-50 bg-white shadow-lg rounded-lg p-2
                                        hidden group-hover:block
                                        ${openTypeId === typeId ? 'block' : ''}`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {type.subtypes.map((sub) => (
                                <button
                                  key={sub._id || sub.name}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTypeClick(type.name, sub.name);
                                  }}
                                  className="text-left"
                                >
                                  <CatalogTile name={sub.name} image={sub.image} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* === Homepage Sections === */}
            {homeTypes.map(
              (ht) =>
                homeTypeListings[ht.name] &&
                homeTypeListings[ht.name].length > 0 && (
                  <HomeTypeSection
                    key={ht._id || ht.name}
                    homeType={ht}
                    listings={homeTypeListings[ht.name]}
                  />
                )
            )}

            {cityListings.length > 0 && (
              <CitySection cityName="Ho Chi Minh City" listings={cityListings} />
            )}

            {/* Empty state */}
            {homeTypes.length === 0 &&
              cityListings.length === 0 &&
              catalog.cities.length === 0 &&
              catalog.homeTypes.length === 0 &&
              !catalogLoading && (
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
      </div>
    </div>
  );
};

export default IndexPage;
