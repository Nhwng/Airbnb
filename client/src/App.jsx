import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/ui/Layout';
import IndexPage from './pages/IndexPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ListingsPage from './pages/ListingsPage';
import BookingsPage from './pages/BookingsPage';
import ListingsFormPage from './pages/ListingsFormPage';  // Cập nhật từ PlacesFormPage thành ListingsFormPage
import ListingPage from './pages/ListingPage';  // Cập nhật từ PlacePage thành ListingPage
import SingleBookedPlace from './pages/SingleBookedPlace';
import PaymentPage from './pages/PaymentPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import OrdersPage from './pages/OrdersPage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPage from './pages/AdminPage';
import axiosInstance from './utils/axios';
import { UserProvider } from './providers/UserProvider';
import { ListingProvider } from './providers/ListingProvider';  // Cập nhật từ PlaceProvider thành ListingProvider
import { AmenityProvider } from './providers/AmenityProvider';  // Thêm mới provider cho Amenity
import { DataCacheProvider } from './contexts/DataCacheContext';
//import { AvailabilityProvider } from './providers/AvailabilityProvider';  // Thêm mới provider cho Availability
//import { ImageProvider } from './providers/ImageProvider';  // Thêm mới provider cho Image
//import { ReviewProvider } from './providers/ReviewProvider';  // Thêm mới provider cho Review
import { GoogleOAuthProvider } from '@react-oauth/google';
import { getItemFromLocalStorage } from './utils';
import NotFoundPage from './pages/NotFoundPage';
import VerifyPinPage from './pages/VerifyPinPage';
import BecomeHostPage from './pages/BecomeHostPage';
import AuctionsPage from './pages/AuctionsPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import AuctionBidPage from './pages/AuctionBidPage';
import AuctionBuyoutPage from './pages/AuctionBuyoutPage';

function App() {
  useEffect(() => {
    // set the token on refreshing the website
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${getItemFromLocalStorage('token')}`;
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <DataCacheProvider>
        <UserProvider>
          <ListingProvider>  {/* Cập nhật từ PlaceProvider thành ListingProvider */}
            <AmenityProvider>  {/* Thêm provider cho Amenity */}
            {/* <AvailabilityProvider>  {/* Thêm provider cho Availability */}
              {/* <ImageProvider>  {/* Thêm provider cho Image */}
                {/* <ReviewProvider>  {/* Thêm provider cho Review */}
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<IndexPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/verify-pin" element={<VerifyPinPage />} />
                      <Route path="/account" element={<ProfilePage />} />
                      <Route path="/account/listings" element={<ListingsPage />} />
                      <Route path="/account/listings/new" element={<ListingsFormPage />} />  {/* Cập nhật từ /places/new thành /listings/new */}
                      <Route path="/account/listings/:id" element={<ListingsFormPage />} />
                      <Route path="/account/listings/:id/edit" element={<ListingsFormPage />} />
                      <Route path="/become-host" element={<BecomeHostPage />} />
                      <Route path="/listing/:id" element={<ListingPage />} />  {/* Cập nhật từ /place/:id thành /listing/:id */}
                      <Route path="/account/orders" element={<OrdersPage />} />
                      <Route path="/account/bookings" element={<BookingsPage />} />
                      <Route path="/account/favorites" element={<FavoritesPage />} />
                      <Route path="/account/bookings/:id" element={<SingleBookedPlace />} />
                      <Route path="/payment/:orderId" element={<PaymentPage />} />
                      <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                      <Route path="/auctions" element={<AuctionsPage />} />
                      <Route path="/auctions/:id" element={<AuctionDetailPage />} />
                      <Route path="/auctions/:id/bid" element={<AuctionBidPage />} />
                      <Route path="/auctions/:id/buyout" element={<AuctionBuyoutPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                  <ToastContainer autoClose={2000} transition={Slide} />
                {/* </ReviewProvider> */}
              {/* </ImageProvider> */}
            {/* </AvailabilityProvider> */}
            </AmenityProvider>
          </ListingProvider>
        </UserProvider>
      </DataCacheProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
