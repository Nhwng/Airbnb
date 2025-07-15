import {useListings } from '../../hooks';  // Thay 'usePlaces' thành 'useListing'
import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';

const IndexPage = () => {
  const allListings = useListings();  // Sử dụng useListing hook thay vì usePlaces
  const { listings, loading } = allListings;  // Thay 'places' thành 'listings'

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="grid grid-cols-1 justify-items-center py-32 px-4 md:grid-cols-2 md:gap-0 lg:grid-cols-3 lg:gap-2 xl:grid-cols-4 xl:gap-10">
      {listings
        .filter(listing => Array.isArray(allListings.images[listing.listing_id]) && allListings.images[listing.listing_id].length > 0)
        .map(listing => (
          <PlaceCard
            place={listing}
            images={allListings.images[listing.listing_id]}
            key={listing._id}
          />
        ))}
    </div>
  );
};

export default IndexPage;
