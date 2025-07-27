import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AccountNav from '@/components/ui/AccountNav';
import PlaceImg from '@/components/ui/PlaceImg';
import BookingDates from '@/components/ui/BookingDates';
import Spinner from '@/components/ui/Spinner';
import axiosInstance from '@/utils/axios';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getBookings = async () => {
      try {
        const { data } = await axiosInstance.get('/reservations');
        const reservations = data.reservations;
        // Fetch all listing details in parallel
        const listings = await Promise.all(
          reservations.map(async (booking) => {
            try {
              const res = await axiosInstance.get(`/listings/${booking.listing_id}`);
              return res.data;
            } catch (e) {
              return null;
            }
          })
        );
        // Gắn thông tin phòng vào từng booking
        const bookingsWithPlace = reservations.map((booking, idx) => ({
          ...booking,
          place: listings[idx],
        }));
        setBookings(bookingsWithPlace);
        setLoading(false);
      } catch (error) {
        console.log('Error: ', error);
        setLoading(false);
      }
    };
    getBookings();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col items-center">
      <AccountNav />
      <div>
        {bookings?.length > 0 ? (
          bookings.map((booking) => (
            <div
              className="mx-4 my-4 flex flex-col gap-2 rounded-2xl bg-gray-100 p-4 shadow-md lg:mx-0"
              key={booking._id}
            >
              <div className="font-bold text-lg">
                {booking?.place?.title || 'No room info'}
              </div>
              <div>
                Ngày đi: {booking.check_in ? new Date(booking.check_in).toLocaleDateString() : ''}
              </div>
              <div>
                Ngày về: {booking.check_out ? new Date(booking.check_out).toLocaleDateString() : ''}
              </div>
              <div>
                Số lượng khách: {booking.num_of_guests}
              </div>
              <div>
                Giá: ₹{booking.total_price ?? 0}
              </div>
            </div>
          ))
        ) : (
          <div className="">
            <div className="flex flex-col justify-start">
              <h1 className="my-6 text-3xl font-semibold">Trips</h1>
              <hr className="border border-gray-300" />
              <h3 className="pt-6 text-2xl font-semibold">
                No trips booked... yet!
              </h3>
              <p>
                Time to dust off you bags and start planning your next adventure
              </p>
              <Link to="/" className="my-4">
                <div className="flex w-40 justify-center rounded-lg border border-black p-3 text-lg font-semibold hover:bg-gray-50">
                  Start Searching
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
