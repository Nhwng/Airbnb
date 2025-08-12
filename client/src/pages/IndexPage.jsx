import { useState, useEffect, useMemo } from 'react';
import { useListings } from '../../hooks';
import axiosInstance from '@/utils/axios';

import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';
import CatalogItem from '@/components/ui/CatalogItem';
import FilterBar from '@/components/ui/FilterBar';

const IndexPage = () => {
  // --- Listings ---
  const allListings = useListings();
  const { listings, loading } = allListings;

  // --- Catalog data ---
  const [catalog, setCatalog] = useState({ cities: [], homeTypes: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);

  // --- Tab state: 'cities' hoặc 'accommodationTypes' ---
  const [activeSection, setActiveSection] = useState('cities');

  // --- Filter state ---
  const [filters, setFilters] = useState({
    priceRange: [100000, 2000000],
    selectedCities: [],
    selectedHomeTypes: [],
    guests: 1
  });

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data } = await axiosInstance.get('/listings/catalog');
        setCatalog(data);
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // --- Filter listings based on selected filters ---
  const filteredListings = useMemo(() => {
    if (!listings || listings.length === 0) return [];

    return listings.filter(listing => {
      // Price filter
      const price = listing.nightly_price;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // City filter
      if (filters.selectedCities.length > 0 && !filters.selectedCities.includes(listing.city)) {
        return false;
      }

      // Home type filter (using room_type field)
      if (filters.selectedHomeTypes.length > 0 && !filters.selectedHomeTypes.includes(listing.room_type)) {
        return false;
      }

      // Guest capacity filter
      if (filters.guests > listing.person_capacity) {
        return false;
      }

      return true;
    });
  }, [listings, filters]);

  if (loading || catalogLoading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen pt-20">
      {/* === Catalog with Tabs (Moved to top) === */}
      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Popular with travelers from Vietnam</h2>

        {/* Tab Buttons */}
        <div className="flex mb-6 space-x-2">
          <button
            onClick={() => setActiveSection('cities')}
            className={`
              px-4 py-2 rounded-lg
              ${activeSection === 'cities'
                ? 'bg-white border border-blue-500 text-blue-500'
                : 'bg-gray-100 text-gray-600 hover:text-blue-500'}
            `}
          >
            Cities
          </button>
          <button
            onClick={() => setActiveSection('accommodationTypes')}
            className={`
              px-4 py-2 rounded-lg
              ${activeSection === 'accommodationTypes'
                ? 'bg-white border border-blue-500 text-blue-500'
                : 'bg-gray-100 text-gray-600 hover:text-blue-500'}
            `}
          >
            Accommodation Types
          </button>
        </div>

        {/* Tab Content */}
        {activeSection === 'cities' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {catalog.cities.map(city => (
              <CatalogItem
                key={city._id}
                name={city.name}
                image={city.image}
              />
            ))}
          </div>
        )}

        {activeSection === 'accommodationTypes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            {catalog.homeTypes.map(type => (
              <div
                key={type._id}
                className="relative group"
              >
                <CatalogItem
                  name={type.name === 'Room Types' ? 'Room' : 'Entire Place'}
                  image={type.image || type.subtypes[0]?.image} // Sử dụng image của subtype đầu tiên nếu không có image cho parent
                />
                {type.subtypes && type.subtypes.length > 0 && (
                  <div className="absolute top-full left-0 w-full hidden group-hover:block bg-white shadow-lg rounded-lg p-2 z-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {type.subtypes.map(subtype => (
                        <CatalogItem
                          key={subtype._id}
                          name={subtype.name}
                          image={subtype.image}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === Filter Bar (Moved below catalog) === */}
      <FilterBar 
        onFiltersChange={setFilters}
        initialFilters={filters}
      />

      {/* === Listings Grid === */}
      <div className="pt-4 pb-8">
        <div className="grid grid-cols-1 justify-items-center px-4
                        md:grid-cols-2 md:gap-0
                        lg:grid-cols-3 lg:gap-2
                        xl:grid-cols-4 xl:gap-6">
        {filteredListings
          .filter(l => Array.isArray(allListings.images[l.listing_id]) &&
                       allListings.images[l.listing_id].length > 0)
          .map(listing => (
            <PlaceCard
              key={listing._id}
              place={listing}
              images={allListings.images[listing.listing_id]}
            />
          ))
        }
        </div>

        {/* === No Results Message === */}
        {filteredListings.length === 0 && listings.length > 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">No places match your search</div>
            <div className="text-gray-400 text-sm">Try adjusting your filters to see more results</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexPage;