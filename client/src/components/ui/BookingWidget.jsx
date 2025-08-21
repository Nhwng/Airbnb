import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';

import { useAuth } from '../../../hooks';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';
import DatePickerWithRange from './DatePickerWithRange';
import Spinner from '@/components/ui/Spinner';

export default function BookingWidget({ place }) {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [noOfGuests, setNoOfGuests] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [disabledDates, setDisabledDates] = useState([]);
  const [redirect, setRedirect] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const { data } = await axiosInstance.get(`/availability/${place.listing_id}`);
        const unavailable = data
          .filter(d => !d.is_available)
          .map(d => new Date(d.date).toISOString().split('T')[0]);
        setDisabledDates(unavailable);
      } catch (err) {
        console.error('Error fetching availability:', err);
      }
    };
    if (place.listing_id) {
      fetchAvailability();
    }
  }, [place.listing_id]);

  useEffect(() => {
    if (user) {
      setName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
    }
  }, [user]);

  const { from, to } = dateRange;
  const numberOfNights = from && to
    ? differenceInDays(new Date(to), new Date(from))
    : 0;

  const handleBooking = async () => {
    if (!from || !to) {
      toast.error('Please select both check-in and check-out dates!');
      return;
    }
    if (!name || !phone) {
      toast.error('Please fill in your name and phone number!');
      return;
    }
    if (noOfGuests > place.maxGuests) {
      toast.error(`Number of guests (${noOfGuests}) exceeds maximum (${place.maxGuests})!`);
      return;
    }
    if (!user) {
      setRedirect('/login');
      return;
    }

    console.log('Creating order with data:', { from, to, noOfGuests, name, phone }); // Debug
    setLoading(true);
    try {
      // Step 1: Create order
      const orderRes = await axiosInstance.post('/orders', {
        checkIn: from,
        checkOut: to,
        numOfGuests: noOfGuests,
        name,
        phone,
        place: place.listing_id,
        price: numberOfNights * place.price,
      });

      const orderId = orderRes.data.order.order_id;
      console.log('Order created with ID:', orderId);

      // Step 2: Redirect to payment page with order ID
      setRedirect(`/payment/${orderId}`);
    } catch (err) {
      console.error('Order creation error:', err);
      toast.error(err.response?.data?.message || 'Something went wrong creating your order!');
    } finally {
      setLoading(false);
    }
  };

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 relative">
      <div className="text-xl text-center text-gray-700 font-medium">
        {formatVND(place.price)} / night
      </div>

      {loading ? (
        <div className="flex justify-center my-4">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-lg border">
            <div
              className="flex w-full cursor-pointer"
              onClick={() => setShowCalendar(v => !v)}
            >
              <div className="flex-1 p-2 border-r text-center">
                {from ? new Date(from).toLocaleDateString() : 'Check-in'}
              </div>
              <div className="flex-1 p-2 text-center">
                {to ? new Date(to).toLocaleDateString() : 'Check-out'}
              </div>
            </div>

            {showCalendar && (
              <div className="absolute z-20 mt-2 bg-white p-4 rounded-lg shadow-lg">
                <DatePickerWithRange
                  setDateRange={setDateRange}
                  disabledDates={disabledDates}
                />
                <button
                  onClick={() => setShowCalendar(false)}
                  className="mt-2 w-full bg-muted text-muted-foreground p-2 rounded-md hover:bg-muted/90"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          <div className="border-t py-3 px-4">
            <label className="block mb-1">Number of guests:</label>
            <input
              type="number"
              min={1}
              max={place.maxGuests}
              value={noOfGuests}
              onChange={e => setNoOfGuests(Math.max(1, Math.min(place.maxGuests, Number(e.target.value) || 1)))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="border-t py-3 px-4">
            <label className="block mb-1">Your full name:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-2"
            />
            <label className="block mb-1">Phone number:</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            onClick={handleBooking}
            className="w-full mt-4 bg-rose-600 text-white p-2 rounded-md hover:bg-rose-700 disabled:bg-rose-400 transition-colors"
            disabled={!from || !to}
          >
            Book this place
            {numberOfNights > 0 && ` ${formatVND(numberOfNights * place.price)}`}
          </button>
        </>
      )}
    </div>
  );
}