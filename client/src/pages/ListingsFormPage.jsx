import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import axiosInstance from '@/utils/axios';

import AccountNav from '@/components/ui/AccountNav';
import Perks from '@/components/ui/Perks';
import PhotosUploader from '@/components/ui/PhotosUploader';
import Spinner from '@/components/ui/Spinner';

const PlacesFormPage = () => {
  const { id } = useParams();
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addedPhotos, setAddedPhotos] = useState([]);


  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currency: 'USD',
    nightly_price: '',
    person_capacity: 1,
    room_type: '',
    latitude: '',
    longitude: '',
    city: '',
  });

  const {
    title,
    description,
    currency,
    nightly_price,
    person_capacity,
    room_type,
    latitude,
    longitude,
    city,
  } = formData;

  const isValidPlaceData = () => {
    if (title.trim() === '') {
      toast.error("Title can't be empty!");
      return false;
    } else if (description.trim() === '') {
      toast.error("Description can't be empty!");
      return false;
    } else if (!currency) {
      toast.error('Currency is required!');
      return false;
    } else if (!nightly_price || isNaN(nightly_price)) {
      toast.error('Nightly price must be a number!');
      return false;
    } else if (!person_capacity || isNaN(person_capacity) || person_capacity < 1) {
      toast.error('Person capacity must be at least 1!');
      return false;
    } else if (!room_type) {
      toast.error('Room type is required!');
      return false;
    } else if (!latitude || isNaN(latitude)) {
      toast.error('Latitude must be a number!');
      return false;
    } else if (!longitude || isNaN(longitude)) {
      toast.error('Longitude must be a number!');
      return false;
    } else if (!city) {
      toast.error('City is required!');
      return false;
    }
    return true;
  };

  const handleFormData = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance.get(`/listings/${id}`).then((response) => {
      const listing = response.data;
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        currency: listing.currency || 'USD',
        nightly_price: listing.nightly_price || '',
        person_capacity: listing.person_capacity || 1,
        room_type: listing.room_type || '',
        latitude: listing.latitude || '',
        longitude: listing.longitude || '',
        city: listing.city || '',
      });
      setLoading(false);
    });
  }, [id]);

  const preInput = (header, description) => {
    return (
      <>
        <h2 className="mt-4 text-2xl">{header}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </>
    );
  };


  const savePlace = async (e) => {
    e.preventDefault();
    const formDataIsValid = isValidPlaceData();
    if (formDataIsValid) {
      try {
        if (id) {
          await axiosInstance.put('/listings/update', {
            id,
            ...formData,
          });
        } else {
          await axiosInstance.post('/listings/add', formData);
        }
        toast.success('Lưu phòng thành công!');
        setRedirect(true);
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          toast.error('Lỗi: ' + error.response.data.message);
        } else {
          toast.error('Đã xảy ra lỗi khi lưu phòng!');
        }
      }
    }
  };

  if (redirect) {
  return <Navigate to={'/account/listings'} />;
  }

  if (loading) {
    return <Spinner />;
  }

  // Hàm điền dữ liệu mẫu
  const fillWithSample = () => {
    setFormData({
      title: 'Saigon Alley Home • check-in 24/7 • Netflix',
      description: 'Saigon Alley Home is on a peaceful alley reflected how Vietnamese local life is. The home is fully equipped and suitable for both short and long stays.',
      currency: 'VND',
      nightly_price: 651983,
      person_capacity: 2,
      room_type: 'Private room',
      latitude: 10.7869982,
      longitude: 106.6787041,
      city: 'Ho Chi Minh City',
    });
    toast.info('Đã điền dữ liệu mẫu!');
  };

  return (
    <div className="p-4">
      <AccountNav />
      <button
        type="button"
        className="mb-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 font-semibold"
        onClick={fillWithSample}
      >
        Dùng mẫu
      </button>
      <form onSubmit={savePlace}>
        {preInput('Title', 'Title for your room. Should be short and catchy.')}
        <input
          type="text"
          name="title"
          value={title}
          onChange={handleFormData}
          placeholder="e.g. Cozy Apartment in City Center"
        />

        {preInput('Description', 'Description of the room')}
        <textarea
          value={description}
          name="description"
          onChange={handleFormData}
        />

        {preInput('Currency', 'Currency for nightly price (e.g. USD, VND)')}
        <input
          type="text"
          name="currency"
          value={currency}
          onChange={handleFormData}
          placeholder="USD"
        />

        {preInput('Nightly Price', 'Price per night')}
        <input
          type="number"
          name="nightly_price"
          value={nightly_price}
          onChange={handleFormData}
          placeholder="e.g. 500"
        />

        {preInput('Person Capacity', 'Maximum number of guests')}
        <input
          type="number"
          name="person_capacity"
          value={person_capacity}
          onChange={handleFormData}
          placeholder="e.g. 4"
        />

        {preInput('Room Type', 'Type of room (e.g. Apartment, House, Studio)')}
        <input
          type="text"
          name="room_type"
          value={room_type}
          onChange={handleFormData}
          placeholder="e.g. Apartment"
        />

        {preInput('Latitude', 'Latitude of the location')}
        <input
          type="number"
          name="latitude"
          value={latitude}
          onChange={handleFormData}
          placeholder="e.g. 21.0285"
        />

        {preInput('Longitude', 'Longitude of the location')}
        <input
          type="number"
          name="longitude"
          value={longitude}
          onChange={handleFormData}
          placeholder="e.g. 105.8542"
        />

        {preInput('City', 'City where the room is located')}
        <input
          type="text"
          name="city"
          value={city}
          onChange={handleFormData}
          placeholder="e.g. Hanoi"
        />

        <button className="mx-auto my-4 flex rounded-full bg-rose-600 hover:bg-rose-700 transition-colors py-3 px-20 text-xl font-semibold text-white">
          Save
        </button>
      </form>
    </div>
  );
};

export default PlacesFormPage;
