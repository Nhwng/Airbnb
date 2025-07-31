import { useState, useEffect } from 'react';
import { useListings } from '../../hooks';      // Thay 'usePlaces' thành 'useListing'
import axiosInstance from '@/utils/axios';

import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';
import CatalogItem from '@/components/ui/CatalogItem';

const IndexPage = () => {
  // --- Listings ---
  const allListings = useListings();
  const { listings, loading } = allListings;

  // --- Catalog data ---
  const [catalog, setCatalog] = useState({ cities: [], homeTypes: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);

  // --- Tab state: 'cities' hoặc 'homeTypes' ---
  const [activeSection, setActiveSection] = useState('cities');

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

  if (loading || catalogLoading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen">
      {/* === Listings Grid === */}
      <div className="grid grid-cols-1 justify-items-center py-18 px-4
                      md:grid-cols-2 md:gap-0
                      lg:grid-cols-3 lg:gap-2
                      xl:grid-cols-4 xl:gap-10">
        {listings
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

      {/* === Catalog with Tabs === */}
      <div className="container mx-auto py-10">
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
            onClick={() => setActiveSection('homeTypes')}
            className={`
              px-4 py-2 rounded-lg
              ${activeSection === 'homeTypes'
                ? 'bg-white border border-blue-500 text-blue-500'
                : 'bg-gray-100 text-gray-600 hover:text-blue-500'}
            `}
          >
            Home Types
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

        {activeSection === 'homeTypes' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {catalog.homeTypes.map(type => (
              <CatalogItem
                key={type._id}
                name={type.name}
                image={type.image}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexPage;
