// components/ui/CatalogItem.jsx
import React from 'react';

const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/100x75?text=No+Image'; // Kích thước nhỏ cho catalog

const CatalogItem = ({ name, image }) => {
  return (
    <div className="flex items-center space-x-2 p-1 border rounded shadow-sm hover:shadow-md transition-shadow">
      <img
        src={image || DEFAULT_IMAGE_URL}
        alt={name}
        className="w-32 h-24  object-cover rounded" // Kích thước nhỏ (w-12 ≈ 48px, h-9 ≈ 36px)
        onError={(e) => { e.target.src = DEFAULT_IMAGE_URL; }} // Hình ảnh dự phòng
      />
      <span className="text-sm truncate">{name}</span>
    </div>
  );
};

export default CatalogItem;