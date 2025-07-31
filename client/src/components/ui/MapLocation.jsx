const MapLocation = ({ latitude, longitude, title, className = "" }) => {
  if (!latitude || !longitude) {
    return (
      <div className={`bg-gray-100 rounded-xl h-64 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Location not available</p>
        </div>
      </div>
    );
  }

  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO_7RUIrpFKx9c&q=${latitude},${longitude}&zoom=15`;
  
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
        <iframe
          title={title || "Property Location"}
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      
      {/* Location coordinates display */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-600">
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </div>
    </div>
  );
};

export default MapLocation;