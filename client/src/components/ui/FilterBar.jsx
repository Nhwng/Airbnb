import React, { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axios';

const FilterBar = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    priceRange: initialFilters.priceRange || [100000, 2000000],
    selectedCities: initialFilters.selectedCities || [],
    selectedHomeTypes: initialFilters.selectedHomeTypes || [],
    guests: initialFilters.guests || 1,
    ...initialFilters
  });

  const [catalog, setCatalog] = useState({ cities: [], homeTypes: [] });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data } = await axiosInstance.get('/listings/catalog');
        setCatalog(data);
      } catch (err) {
        console.error('Error fetching catalog:', err);
      }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handlePriceChange = (index, value) => {
    const newRange = [...filters.priceRange];
    newRange[index] = parseInt(value);
    if (index === 0 && newRange[0] >= newRange[1]) {
      newRange[1] = newRange[0] + 50000;
    }
    if (index === 1 && newRange[1] <= newRange[0]) {
      newRange[0] = newRange[1] - 50000;
    }
    setFilters(prev => ({ ...prev, priceRange: newRange }));
  };

  const toggleCity = (cityName) => {
    setFilters(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.includes(cityName)
        ? prev.selectedCities.filter(c => c !== cityName)
        : [...prev.selectedCities, cityName]
    }));
  };

  const toggleHomeType = (homeTypeName) => {
    setFilters(prev => ({
      ...prev,
      selectedHomeTypes: prev.selectedHomeTypes.includes(homeTypeName)
        ? prev.selectedHomeTypes.filter(h => h !== homeTypeName)
        : [...prev.selectedHomeTypes, homeTypeName]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: [100000, 2000000],
      selectedCities: [],
      selectedHomeTypes: [],
      guests: 1
    });
  };

  const hasActiveFilters = () => {
    return filters.priceRange[0] !== 100000 || 
           filters.priceRange[1] !== 2000000 || 
           filters.selectedCities.length > 0 || 
           filters.selectedHomeTypes.length > 0 || 
           filters.guests !== 1;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange[0] !== 100000 || filters.priceRange[1] !== 2000000) count++;
    if (filters.selectedCities.length > 0) count++;
    if (filters.selectedHomeTypes.length > 0) count++;
    if (filters.guests !== 1) count++;
    return count;
  };

  return (
    <>
      {/* Main Filter Bar */}
      <div className="sticky top-20 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h10a1 1 0 110 2H4a1 1 0 01-1-1zM3 20a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" fill="currentColor"/>
                </svg>
                Filters
                {hasActiveFilters() && (
                  <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              {/* Compact Dropdown */}
              {showFilters && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 w-80 z-50">
                  <div className="p-4 space-y-4">
                    
                    {/* Price Range Section */}
                    <div>
                      <h3 className="text-base font-semibold mb-3">Price range</h3>
                      <p className="text-xs text-gray-600 mb-3">Nightly prices before fees and taxes</p>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">Minimum</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₫</span>
                              <input
                                type="number"
                                value={filters.priceRange[0]}
                                onChange={(e) => handlePriceChange(0, e.target.value)}
                                className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-xs"
                                min="50000"
                                max="10000000"
                                step="50000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">Maximum</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₫</span>
                              <input
                                type="number"
                                value={filters.priceRange[1]}
                                onChange={(e) => handlePriceChange(1, e.target.value)}
                                className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-xs"
                                min="50000"
                                max="10000000"
                                step="50000"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>₫{formatPrice(filters.priceRange[0])}</span>
                            <span>₫{formatPrice(filters.priceRange[1])}</span>
                          </div>
                          <div className="relative h-2">
                            <div className="absolute w-full h-2 bg-gray-200 rounded-full"></div>
                            <div 
                              className="absolute h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                              style={{
                                left: `${((filters.priceRange[0] - 100000) / (2000000 - 100000)) * 100}%`,
                                width: `${((filters.priceRange[1] - filters.priceRange[0]) / (2000000 - 100000)) * 100}%`
                              }}
                            />
                            <input
                              type="range"
                              min="100000"
                              max="2000000"
                              step="50000"
                              value={filters.priceRange[0]}
                              onChange={(e) => handlePriceChange(0, e.target.value)}
                              className="absolute w-full h-2 appearance-none bg-transparent cursor-pointer range-slider"
                            />
                            <input
                              type="range"
                              min="100000"
                              max="2000000"
                              step="50000"
                              value={filters.priceRange[1]}
                              onChange={(e) => handlePriceChange(1, e.target.value)}
                              className="absolute w-full h-2 appearance-none bg-transparent cursor-pointer range-slider"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guests Section */}
                    <div>
                      <h3 className="text-base font-semibold mb-3">Guests</h3>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <div className="font-medium">Guests</div>
                          <div className="text-sm text-gray-600">Ages 13 or above</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 disabled:opacity-25"
                            disabled={filters.guests <= 1}
                          >
                            −
                          </button>
                          <span className="font-medium w-8 text-center">{filters.guests}</span>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, guests: Math.min(16, prev.guests + 1) }))}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 disabled:opacity-25"
                            disabled={filters.guests >= 16}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cities Section */}
                    <div>
                      <h3 className="text-base font-semibold mb-3">Cities</h3>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {catalog.cities.map(city => (
                          <label key={city._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.selectedCities.includes(city.name)}
                              onChange={() => toggleCity(city.name)}
                              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm">{city.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Property Types Section */}
                    <div>
                      <h3 className="text-base font-semibold mb-3">Property type</h3>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {catalog.homeTypes.map(homeType => (
                          <label key={homeType._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters.selectedHomeTypes.includes(homeType.name)}
                              onChange={() => toggleHomeType(homeType.name)}
                              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm">{homeType.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <button
                        onClick={clearAllFilters}
                        className="text-sm font-medium text-gray-600 hover:text-black underline"
                      >
                        Clear all
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200"
                      >
                        Show places
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clear All (when filters active) */}
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-black underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-25"
          onClick={() => setShowFilters(false)}
        />
      )}

      <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          background: white;
          border: 2px solid #ec4899;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .range-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          background: white;
          border: 2px solid #ec4899;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .range-slider::-webkit-slider-track {
          background: transparent;
        }
        
        .range-slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </>
  );
};

export default FilterBar;