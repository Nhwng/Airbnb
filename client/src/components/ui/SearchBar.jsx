import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';

const SearchBar = ({ onSearch, className = "" }) => {
  // Capture the onSearch function in a ref to prevent it from becoming undefined
  const onSearchRef = useRef(onSearch);
  
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  const [searchData, setSearchData] = useState({
    city: '',
    checkin: '',
    checkout: '',
    guests: 1
  });

  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const cities = [
    { value: 'Hanoi', label: 'Hanoi' },
    { value: 'Da Nang', label: 'Da Nang' },
    { value: 'Ho Chi Minh City', label: 'Ho Chi Minh City' }
  ];

  const filteredCities = cities.filter(city =>
    city.label.toLowerCase().includes(searchData.city.toLowerCase())
  );

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCitySelect = (city) => {
    setSearchData(prev => ({ ...prev, city: city.value }));
    setShowCityDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields - only city is required
    if (!searchData.city) {
      alert('Please select a city');
      return;
    }

    // Validate dates if both are provided
    if (searchData.checkin && searchData.checkout) {
      const checkinDate = new Date(searchData.checkin);
      const checkoutDate = new Date(searchData.checkout);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkinDate < today) {
        alert('Check-in date cannot be in the past');
        return;
      }

      if (checkoutDate <= checkinDate) {
        alert('Check-out date must be after check-in date');
        return;
      }
    }

    // Call the search handler using ref
    const searchFunction = onSearchRef.current;
    
    if (typeof searchFunction === 'function') {
      searchFunction(searchData);
    } else {
      alert('Search function not available. Please refresh the page.');
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinCheckoutDate = () => {
    if (!searchData.checkin) return getTodayDate();
    const checkinDate = new Date(searchData.checkin);
    checkinDate.setDate(checkinDate.getDate() + 1);
    return checkinDate.toISOString().split('T')[0];
  };

  return (
    <div className={`bg-white shadow-lg border border-gray-200 ${className}`}>
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Location Input */}
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline w-4 h-4 mr-1" />
              Where <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchData.city}
                onChange={(e) => {
                  handleInputChange('city', e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Search destinations"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 placeholder-gray-500"
                autoComplete="off"
              />
              
              {/* City Dropdown */}
              {showCityDropdown && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                  {filteredCities.map((city) => (
                    <button
                      key={city.value}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg text-gray-900"
                    >
                      <MapPin className="inline w-4 h-4 mr-2 text-gray-400" />
                      {city.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Check-in Date */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline w-4 h-4 mr-1" />
              Check-in
            </label>
            <input
              type="date"
              value={searchData.checkin}
              onChange={(e) => handleInputChange('checkin', e.target.value)}
              min={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900"
            />
          </div>

          {/* Check-out Date */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline w-4 h-4 mr-1" />
              Check-out
            </label>
            <input
              type="date"
              value={searchData.checkout}
              onChange={(e) => handleInputChange('checkout', e.target.value)}
              min={getMinCheckoutDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900"
            />
          </div>

          {/* Guests Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="inline w-4 h-4 mr-1" />
              Guests
            </label>
            <select
              value={searchData.guests}
              onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i + 1 === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0">
            <button
              type="submit"
              className="w-12 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Help text */}
        <p className="text-xs text-gray-500 mt-2">
          * Required field. Dates are optional.
        </p>
      </form>

      {/* Click outside to close dropdown */}
      {showCityDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowCityDropdown(false)}
        />
      )}
    </div>
  );
};

export default SearchBar;
