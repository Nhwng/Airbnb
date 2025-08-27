import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, CreditCard, Home, Plane, ChevronLeft, ChevronRight } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import PlaceImg from '@/components/ui/PlaceImg';
import Spinner from '@/components/ui/Spinner';
import { useDataCache } from '../contexts/DataCacheContext';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';

const BookingsPage = () => {
  const { getCachedReservations } = useDataCache();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  const fetchBookings = async (page = 1, limit = 10) => {
    try {
      console.log('BookingsPage: Starting to fetch cached reservations...');
      console.log('BookingsPage: Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      setLoading(true);
      
      // Use cached API call
      const data = await getCachedReservations(page, limit);
      
      console.log('Fetched cached reservations:', data);
      
      // Transform the already populated data
      const bookingsWithPlace = data.reservations
        .filter(booking => booking.listing_id) // Only include bookings with valid listings
        .map(booking => ({
          ...booking,
          place: {
            listing_id: booking.listing_id.listing_id,
            title: booking.listing_id.title,
            city: booking.listing_id.city,
            address: booking.listing_id.address,
            nightly_price: booking.listing_id.nightly_price,
            description: booking.listing_id.description,
            room_type: booking.listing_id.room_type,
            person_capacity: booking.listing_id.person_capacity,
            photos: booking.listing_images || [],
            images: booking.listing_images || []
          }
        }));
      
      console.log('Final cached bookings:', bookingsWithPlace);
      setBookings(bookingsWithPlace);
      setPagination(data.pagination || pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings: ', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePageChange = (newPage) => {
    fetchBookings(newPage, pagination.limit);
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AccountNav />
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Your Trips</h1>
          <p className="text-gray-600">Manage your confirmed bookings and past stays</p>
        </div>
        
        {bookings?.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const checkInDate = new Date(booking.check_in);
              const checkOutDate = new Date(booking.check_out);
              const currentDate = new Date();
              const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
              const isUpcoming = checkInDate > currentDate;
              const isPast = checkOutDate < currentDate;
              const isCurrent = !isUpcoming && !isPast;
              
              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Property Image */}
                  <div className="relative h-48 overflow-hidden">
                    {booking?.place && (booking?.place?.photos?.length > 0 || booking?.place?.images?.length > 0) ? (
                      <img 
                        src={
                          booking.place.photos?.[0] || 
                          booking.place.images?.[0]?.url || 
                          booking.place.images?.[0] ||
                          '/placeholder-property.jpg'
                        } 
                        alt={booking.place.title || 'Property image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.log('Image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* Fallback placeholder - always rendered but hidden by default */}
                    <div 
                      className="w-full h-full bg-gray-200 flex items-center justify-center absolute inset-0"
                      style={{
                        display: (booking?.place?.photos?.length > 0 || booking?.place?.images?.length > 0) ? 'none' : 'flex'
                      }}
                    >
                      <div className="text-center">
                        <Home className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No image available</p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                        isUpcoming 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : isPast 
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {isUpcoming && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        {isCurrent && (
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        )}
                        {isPast && (
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        )}
                        {isUpcoming ? 'Upcoming' : isPast ? 'Past' : 'Current'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title and Location */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {booking?.place?.title || 'Property Information Unavailable'}
                      </h3>
                      {booking?.place?.address && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="truncate">{booking.place.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {checkInDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })} - {checkOutDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-gray-500">
                            {nights} {nights === 1 ? 'night' : 'nights'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <Users className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-sm">
                          {booking.num_of_guests} {booking.num_of_guests === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                        <div className="text-sm">
                          <span className="font-semibold">{formatVND(booking.total_price)}</span>
                          <span className="text-gray-500 ml-1">total</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100">
                      {booking?.place ? (
                        <Link
                          to={`/listing/${booking.place.listing_id || booking.place._id || booking.listing_id}`}
                          className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center"
                        >
                          View Property
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">Property details unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-20 px-6">
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="w-12 h-12 text-rose-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No trips booked... yet!</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Time to dust off your bags and start planning your next adventure. The world is waiting for you!
            </p>
            <Link
              to="/"
              className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-xl hover:bg-rose-700 transition-colors font-medium space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Start Searching</span>
            </Link>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                pagination.hasPrevPage
                  ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.currentPage;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                pagination.hasNextPage
                  ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
            
            <div className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} bookings
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
