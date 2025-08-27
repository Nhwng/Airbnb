import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gavel, 
  Search,
  Filter,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Clock,
  Info,
  Eye
} from 'lucide-react';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils'; 
import Spinner from '@/components/ui/Spinner';
import AuctionCard from '@/components/ui/AuctionCard';
import { useDataCache } from '../contexts/DataCacheContext';
import { useAuth } from '../../hooks';

// Modal component for auction rules
const AuctionRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Auction Rules & Guidelines</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="space-y-4 text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 How Auctions Work</h4>
              <ul className="space-y-1 text-sm">
                <li>• Bid on exclusive accommodations for dates 15+ days in advance</li>
                <li>• Highest bidder wins when the auction ends</li>
                <li>• Use "Buyout" price for immediate purchase</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">⚡ Bidding Rules</h4>
              <ul className="space-y-1 text-sm">
                <li>• Minimum bid increment: ₫10,000</li>
                <li>• No bid withdrawal once placed</li>
                <li>• Payment required within 24 hours of winning</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔒 Safety & Security</h4>
              <ul className="space-y-1 text-sm">
                <li>• All properties are verified and approved</li>
                <li>• Secure payment processing</li>
                <li>• Full refund if host cancels</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuctionsPage = () => {
  const { user } = useAuth();
  const { getCachedAuctions } = useDataCache();
  
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12
  });

  // Filter and sort options
  const [filters, setFilters] = useState({
    status: 'active', // active, ended, all
    sortBy: 'ending_soon', // ending_soon, newest, price_low, price_high
    searchQuery: ''
  });

  const fetchAuctions = async (page = 1, limit = 12) => {
    try {
      setLoading(true);
      console.log('AuctionsPage: Fetching cached auctions...');
      
      // Use cached data with filters
      const data = await getCachedAuctions(page, limit, filters);
      
      console.log('Fetched cached auctions:', data);
      
      setAuctions(data.auctions || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [filters]);

  const handlePageChange = (newPage) => {
    fetchAuctions(newPage, pagination.limit);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAuctions(1, pagination.limit);
  };

  // Statistics
  const activeAuctions = auctions.filter(a => {
    const now = new Date();
    const endTime = new Date(a.auction_end);
    return endTime > now;
  }).length;

  const totalBids = auctions.reduce((sum, auction) => sum + (auction.bid_count || 0), 0);

  if (loading && auctions.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-rose-500 to-orange-600 text-white pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Gavel className="w-12 h-12 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold">Auction Marketplace</h1>
            </div>
            <p className="text-xl text-rose-100 max-w-2xl mx-auto mb-8">
              Bid on exclusive accommodations and win amazing stays at competitive prices
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{activeAuctions}</div>
                <div className="text-rose-100">Active Auctions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{totalBids}</div>
                <div className="text-rose-100">Total Bids</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{auctions.length}</div>
                <div className="text-rose-100">Properties</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8">
          <form onSubmit={handleSearch} className="p-6">
            <div className="flex flex-col xl:flex-row gap-4 items-end">
              {/* Search Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="inline w-4 h-4 mr-1" />
                  Search Auctions
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, city, or description..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 placeholder-gray-500"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="inline w-4 h-4 mr-1" />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 bg-white"
                >
                  <option value="active">Active Auctions</option>
                  <option value="ended">Ended Auctions</option>
                  <option value="all">All Auctions</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <SortDesc className="inline w-4 h-4 mr-1" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 bg-white"
                >
                  <option value="ending_soon">Ending Soon</option>
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  type="submit"
                  className="w-12 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                  aria-label="Search auctions"
                >
                  <Search className="w-5 h-5" />
                </button>
                
                {/* Rules Button */}
                <button
                  type="button"
                  onClick={() => setShowRules(true)}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                  title="View Auction Rules"
                  aria-label="View auction rules"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-4">
              Search across auction titles, property descriptions, and locations. Use filters to narrow down results.
            </p>
          </form>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {filters.status === 'active' ? 'Active Auctions' : 
               filters.status === 'ended' ? 'Ended Auctions' : 
               'All Auctions'}
            </h2>
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${pagination.totalCount} auctions found`}
            </p>
          </div>

          <button
            onClick={() => fetchAuctions(pagination.currentPage, pagination.limit)}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <Clock className="w-4 h-4 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Auctions Grid */}
        {auctions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {auctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4">
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
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} auctions
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gavel className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {filters.status === 'active' ? 'No Active Auctions' : 
               filters.status === 'ended' ? 'No Ended Auctions' : 
               'No Auctions Found'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {filters.searchQuery ? 
                `No auctions match "${filters.searchQuery}". Try adjusting your search terms.` :
                'There are currently no auctions matching your criteria. Check back later for new opportunities.'
              }
            </p>
            {filters.searchQuery && (
              <button
                onClick={() => {
                  handleFilterChange('searchQuery', '');
                  handleFilterChange('status', 'active');
                }}
                className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      <AuctionRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};

export default AuctionsPage;