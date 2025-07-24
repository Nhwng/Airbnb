import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';
import PlaceGallery from '@/components/ui/PlaceGallery';
import PerksWidget from '@/components/ui/PerksWidget';
import BookingWidget from '@/components/ui/BookingWidget';
import { Button } from '@/components/ui/button';
import DescriptionModal from '@/components/ui/DescriptionModal';

const MAX_DESC_LENGTH = 200;

const ListingPage = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const getListing = async () => {
      try {
        const { data } = await axiosInstance.get(`/listings/${id}`);
        setListing(data);
      } catch (error) {
        setListing(null);
      } finally {
        setLoading(false);
      }
    };
    getListing();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchImages = async () => {
      try {
        const { data } = await axiosInstance.get(`/images/${id}`);
        setImages(data.map((img) => img.url)); // lấy mảng url ảnh
      } catch (e) {
        setImages([]);
      }
    };
    fetchImages();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchAmenities = async () => {
      try {
        const { data } = await axiosInstance.get(`/amenities/${id}`);
        setAmenities(data);
      } catch (e) {
        setAmenities([]);
      }
    };
    fetchAmenities();
  }, [id]);


  if (loading) {
    return <Spinner />;
  }

  if (!listing) {
    return <div>Listing not found</div>;
  }

  return (
    <div className="mt-4 overflow-x-hidden px-8 pt-20 ">
      <h1 className="text-3xl">{listing.title}</h1>
      {address && (
        <div className="text-gray-600 text-sm mb-2">{address}</div>
      )}
      <PlaceGallery photos={images} />
      <div className="mt-8 mb-8 grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr]">
        <div>
          <div className="my-4">
            <h2 className="text-2xl font-semibold">Description</h2>
            <div>
              {listing.description.length > MAX_DESC_LENGTH ? (
                <>
                  <span
                    style={{ whiteSpace: 'pre-line' }}
                    dangerouslySetInnerHTML={{
                      __html: listing.description
                        ? listing.description.slice(0, MAX_DESC_LENGTH).replace(/<br\s*\/?>/gi, '<br/>') + '...'
                        : '',
                    }}
                  />
                  <div className="mt-2">
                    <Button
                      variant="secondary"
                      className="p-0"
                      onClick={() => setShowDescModal(true)}
                    >
                      Hiển thị thêm
                    </Button>
                  </div>
                  <DescriptionModal
                    open={showDescModal}
                    onClose={() => setShowDescModal(false)}
                    description={listing.description}
                  />
                </>
              ) : (
                <span
                  style={{ whiteSpace: 'pre-line' }}
                  dangerouslySetInnerHTML={{
                    __html: listing.description
                      ? listing.description.replace(/<br\s*\/?>/gi, '<br/>')
                      : '',
                  }}
                />
              )}
            </div>
          </div>
          <div>
            <strong>Price:</strong> {listing.nightly_price} {listing.currency}
          </div>
          <div>
            <strong>Capacity:</strong> {listing.person_capacity}
          </div>
          <div>
            <strong>Room type:</strong> {listing.room_type}
          </div>
          <PerksWidget amenities={amenities} />
        </div>
        <div>
          <BookingWidget
            place={{
              ...listing,
              maxGuests: listing.person_capacity,
              price: listing.nightly_price,
              listing_id: listing.listing_id,
            }}
          />
        </div>
      </div>
      {/* Extra info nếu có */}
      {listing.extraInfo && (
        <div className="-mx-8 border-t bg-white px-8 py-8">
          <h2 className="mt-4 text-2xl font-semibold">Extra Info</h2>
          <div className="mb-4 mt-2 text-sm leading-5 text-gray-700">
            {listing.extraInfo}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingPage;
