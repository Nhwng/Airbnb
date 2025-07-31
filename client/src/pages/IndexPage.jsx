import {useListings } from '../../hooks';  // Thay 'usePlaces' thành 'useListing'
import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';

const IndexPage = () => {
  const { listings, images, loading } = useListings();  // Use destructured approach

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="grid grid-cols-1 justify-items-center py-32 px-4 md:grid-cols-2 md:gap-0 lg:grid-cols-3 lg:gap-2 xl:grid-cols-4 xl:gap-10">
      {listings
        .filter(listing => Array.isArray(images[listing.listing_id]) && images[listing.listing_id].length > 0)
        .map(listing => (
          <PlaceCard
            place={listing}
            images={images[listing.listing_id]}
            key={listing._id}
          />
        ))}
    </div>
  );
};

export default IndexPage;
