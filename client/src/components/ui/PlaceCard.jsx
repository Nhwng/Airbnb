import React from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/400x300?text=No+Image';

const PlaceCard = ({ place, images }) => {
  const { listing_id: placeId, title, nightly_price } = place;

  // Lấy đại 1 ảnh đầu tiên có cùng listing_id
  let selectedImage = null;
  if (Array.isArray(images)) {
    selectedImage = images.find((img) => img.listing_id === placeId);
  }

  return (
    <Link to={`/listing/${placeId}`} className="m-4 flex flex-col md:m-2 xl:m-0">
      <div className="card">
        <img
          src={selectedImage?.url || DEFAULT_IMAGE_URL}
          className="h-4/5 w-full rounded-xl object-cover"
          alt="Listing"
        />
        <h2 className="truncate font-bold">{title}</h2>
        <div className="mt-1">
          <span className="font-semibold">₫{new Intl.NumberFormat('vi-VN').format(nightly_price)} </span>
          per night
        </div>
      </div>
    </Link>
  );
};

export default PlaceCard;
