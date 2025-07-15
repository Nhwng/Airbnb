const MapLocation = ({ latitude, longitude, title }) => {
  if (!latitude || !longitude) return null;
  const mapSrc = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  return (
    <div className="my-4 rounded-lg overflow-hidden" style={{ height: 300 }}>
      <iframe
        title={title || "Map"}
        src={mapSrc}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default MapLocation;