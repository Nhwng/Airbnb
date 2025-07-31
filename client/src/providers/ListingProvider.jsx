import { createContext } from 'react';
import { useProvideListings } from '../../hooks';  // Thay đổi từ useProvidePlaces thành useProvideListings

const initialState = {
  listings: [],   // Thay 'places' thành 'listings'
  setListings: () => {},
  images: {},
  loading: true,
  setLoading: () => {},
};

export const ListingContext = createContext(initialState);  // Thay 'PlaceContext' thành 'ListingContext'

export const ListingProvider = ({ children }) => {  // Thay 'PlaceProvider' thành 'ListingProvider'
  const allListings = useProvideListings();  // Thay 'useProvidePlaces' thành 'useProvideListings'

  return (
    <ListingContext.Provider value={allListings}>  {/* Thay 'PlaceContext' thành 'ListingContext' */}
      {children}
    </ListingContext.Provider>
  );
};
