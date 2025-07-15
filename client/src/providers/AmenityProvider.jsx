import { createContext, useContext, useState } from 'react';
import axiosInstance from '@/utils/axios';

const AmenityContext = createContext({
  amenities: [],
  loading: true,
  getAmenities: async () => {},
});

export const AmenityProvider = ({ children }) => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAmenities = async (listingId) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/amenities/${listingId}`);
      setAmenities(data);
    } catch (err) {
      setAmenities([]);
    }
    setLoading(false);
  };

  return (
    <AmenityContext.Provider value={{ amenities, loading, getAmenities }}>
      {children}
    </AmenityContext.Provider>
  );
};

export const useAmenity = () => useContext(AmenityContext);