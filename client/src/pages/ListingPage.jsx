import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';
import Spinner from '@/components/ui/Spinner';
import PlaceGallery from '@/components/ui/PlaceGallery';
import PerksWidget from '@/components/ui/PerksWidget';
import BookingWidget from '@/components/ui/BookingWidget';
import MapLocation from '@/components/ui/MapLocation';
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
        setImages(data.map((img) => img.url));
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Listing not found</h1>
          <p className="text-gray-600">The property you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title and Basic Info */}
        <div className="py-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">{listing.title}</h1>
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{listing.city}</span>
            <span className="mx-2">•</span>
            <span>{listing.room_type}</span>
            <span className="mx-2">•</span>
            <span>{listing.person_capacity} guests</span>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="mb-12">
          <PlaceGallery photos={images} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Host Info */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {listing.room_type} hosted by Airbnb
                  </h2>
                  <div className="flex items-center text-gray-600 text-sm space-x-4">
                    <span>{listing.person_capacity} guests</span>
                    <span>•</span>
                    <span>1 bedroom</span>
                    <span>•</span>
                    <span>1 bathroom</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="border-b border-gray-200 pb-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <svg className="w-6 h-6 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01M15 7H9m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9m0 0v6a2 2 0 002 2h4a2 2 0 002-2V9M9 7v4a2 2 0 002 2h4a2 2 0 002-2V9M9 7H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8H7m2 0v8" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-gray-900">Great location</h3>
                    <p className="text-gray-600 text-sm">Located in {listing.city} with easy access to local attractions.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <svg className="w-6 h-6 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-gray-900">Self check-in</h3>
                    <p className="text-gray-600 text-sm">Check yourself in with convenient access.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <svg className="w-6 h-6 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-8 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h2m8-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m0-10V7a4 4 0 10-8 0v4m8 0V7" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-gray-900">Great for families</h3>
                    <p className="text-gray-600 text-sm">Accommodates up to {listing.person_capacity} guests comfortably.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About this place</h2>
              <div className="text-gray-700 leading-relaxed">
                {listing.description && listing.description.length > MAX_DESC_LENGTH ? (
                  <>
                    <p className="mb-4">
                      {listing.description.slice(0, MAX_DESC_LENGTH)}...
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowDescModal(true)}
                      className="text-gray-900 border-gray-900 hover:bg-gray-50"
                    >
                      Show more
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    <DescriptionModal
                      open={showDescModal}
                      onClose={() => setShowDescModal(false)}
                      description={listing.description}
                    />
                  </>
                ) : (
                  <p>{listing.description}</p>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="border-b border-gray-200 pb-8">
              <PerksWidget amenities={amenities} />
            </div>

            {/* Location */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Where you'll be</h2>
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">{listing.city}</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Explore the area and discover local attractions, restaurants, and activities.
                </p>
              </div>
              <MapLocation
                latitude={listing.latitude}
                longitude={listing.longitude}
                title={listing.title}
                className="mb-4"
              />
            </div>

            {/* Extra Info */}
            {listing.extraInfo && (
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional information</h2>
                <p className="text-gray-700 leading-relaxed">{listing.extraInfo}</p>
              </div>
            )}
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingWidget
                place={{
                  ...listing,
                  maxGuests: listing.person_capacity,
                  price: listing.nightly_price,
                  listing_id: listing.listing_id,
                }}
              />

              {/* Report Listing */}
              <div className="text-center mt-6">
                <button className="text-gray-600 hover:text-gray-900 text-sm underline transition-colors">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Report this listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPage;