import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import axiosInstance from '@/utils/axios';

import AccountNav from '@/components/ui/AccountNav';
import InfoCard from '@/components/ui/InfoCard';
import Spinner from '@/components/ui/Spinner';
import MapLocation from '@/components/ui/MapLocation';

const ListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getListings = async () => {
      try {
        const { data } = await axiosInstance.get('listings/user-listings');
        setListings(data);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    getListings();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <AccountNav />
      <div className="text-center ">
        <Link
          className="inline-flex gap-1 rounded-full bg-primary py-2 px-6 text-white"
          to={'/account/listings/new'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add new listing
        </Link>
      </div>
      <div className="mx-4 mt-4">
        {listings.length > 0 &&
          listings.map((listing) => (
            <div key={listing.listing_id}>
              <InfoCard place={listing} />
              <MapLocation
                latitude={listing.latitude}
                longitude={listing.longitude}
                title={listing.title}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default ListingsPage;
