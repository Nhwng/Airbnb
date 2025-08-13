import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, DollarSign, ChevronDown } from 'lucide-react';
import { Calendar as CalendarComponent } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

const SearchBar = ({ onSearch, className = "" }) => {
  // Capture the onSearch function in a ref to prevent it from becoming undefined
  const onSearchRef = useRef(onSearch);
  
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  const [searchData, setSearchData] = useState({
    city: '',
    checkin: null,
    checkout: null,
    guests: 1,
    minPrice: '',
    maxPrice: ''
  });

  const [dateRange, setDateRange] = useState({
    from: null,
    to: null
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);

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

  const handleDateSelect = (range) => {
    setDateRange(range);
    setSearchData(prev => ({
      ...prev,
      checkin: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
      checkout: range?.to ? format(range.to, 'yyyy-MM-dd') : ''
    }));
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Add dates';
    if (!dateRange?.to) return format(dateRange.from, 'MMM dd');
    return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`;
  };

  const formatGuestCount = (count) => {
    return `${count} ${count === 1 ? 'guest' : 'guests'}`;
  };

  const formatPriceRange = () => {
    if (!searchData.minPrice && !searchData.maxPrice) return 'Any price';
    if (searchData.minPrice && searchData.maxPrice) {
      return `${searchData.minPrice}₫ - ${searchData.maxPrice}₫`;
    }
    if (searchData.minPrice) return `${searchData.minPrice}₫+`;
    return `Up to ${searchData.maxPrice}₫`;
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
    if (dateRange?.from && dateRange?.to) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateRange.from < today) {
        alert('Check-in date cannot be in the past');
        return;
      }

      if (dateRange.to <= dateRange.from) {
        alert('Check-out date must be after check-in date');
        return;
      }
    }

    // Validate price range
    if (searchData.minPrice && searchData.maxPrice) {
      if (parseInt(searchData.minPrice) >= parseInt(searchData.maxPrice)) {
        alert('Minimum price must be less than maximum price');
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
        <div className="flex flex-col lg:flex-row gap-2 items-end">
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

          {/* Date Range Picker */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline w-4 h-4 mr-1" />
              Dates
            </label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className={cn(
                    "text-sm",
                    !dateRange?.from ? "text-gray-500" : "text-gray-900"
                  )}>
                    {formatDateRange()}
                  </span>
                  <ChevronDown className="inline w-4 h-4 ml-2 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="inline w-4 h-4 mr-1" />
              Guests
            </label>
            <Popover open={showGuestDropdown} onOpenChange={setShowGuestDropdown}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-900">
                    {formatGuestCount(searchData.guests)}
                  </span>
                  <ChevronDown className="inline w-4 h-4 ml-2 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  {[...Array(10)].map((_, i) => (
                    <button
                      key={i + 1}
                      type="button"
                      onClick={() => {
                        handleInputChange('guests', i + 1);
                        setShowGuestDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        searchData.guests === i + 1
                          ? "bg-rose-100 text-rose-900"
                          : "hover:bg-gray-100"
                      )}
                    >
                      {formatGuestCount(i + 1)}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Price Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Price Range (VND)
            </label>
            <Popover open={showPriceFilter} onOpenChange={setShowPriceFilter}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className={cn(
                    "text-sm",
                    !searchData.minPrice && !searchData.maxPrice ? "text-gray-500" : "text-gray-900"
                  )}>
                    {formatPriceRange()}
                  </span>
                  <ChevronDown className="inline w-4 h-4 ml-2 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Price (per night)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        value={searchData.minPrice}
                        onChange={(e) => handleInputChange('minPrice', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none">₫</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Price (per night)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="1000000"
                        value={searchData.maxPrice}
                        onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none">₫</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchData(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
                      }}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPriceFilter(false)}
                      className="flex-1 px-3 py-1 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
        <p className="text-xs text-gray-500 mt-3">
          * Required field. Dates and price range are optional.
        </p>
      </form>

      {/* Click outside to close dropdowns */}
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
