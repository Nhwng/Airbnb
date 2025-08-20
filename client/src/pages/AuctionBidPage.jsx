import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Gavel, ArrowLeft, AlertCircle } from 'lucide-react';
import axiosInstance from '@/utils/axios';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const AuctionBidPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchAuctionDetails = async () => {
      try {
        const { data } = await axiosInstance.get(`/auctions/${id}`);
        setAuction(data);
        
        // Set suggested bid amount (current bid + reasonable increment)
        const suggestedBid = data.current_bid + Math.max(1000, Math.floor(data.current_bid * 0.05)); // 5% or 1,000₫ minimum
        setBidAmount(suggestedBid.toString());
      } catch (error) {
        console.error('Error fetching auction details:', error);
        setError('Failed to fetch auction details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAuctionDetails();
    }
  }, [id, user, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const getMinimumIncrement = (currentBid) => {
    // Dynamic minimum increment based on current bid amount
    if (currentBid < 100000) return 1000;      // Under 100k: 1k minimum
    if (currentBid < 500000) return 5000;      // Under 500k: 5k minimum  
    if (currentBid < 1000000) return 10000;    // Under 1M: 10k minimum
    return 25000;                              // Over 1M: 25k minimum
  };

  const getMinimumBid = () => {
    if (!auction) return 0;
    return auction.current_bid + getMinimumIncrement(auction.current_bid);
  };

  const isValidBid = (bidValue) => {
    if (!auction || !bidValue) return false;
    const minIncrement = getMinimumIncrement(auction.current_bid);
    return bidValue >= (auction.current_bid + minIncrement) && bidValue < auction.buyout_price;
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const bidValue = parseInt(bidAmount);
      const minIncrement = getMinimumIncrement(auction.current_bid);
      const minimumBid = auction.current_bid + minIncrement;
      
      if (!isValidBid(bidValue)) {
        throw new Error(`Bid must be at least ${formatPrice(minIncrement)} higher than current bid. Minimum bid: ${formatPrice(minimumBid)}`);
      }

      await axiosInstance.post(`/auctions/${id}/bid`, {
        bid_amount: bidValue
      });

      alert('Bid placed successfully!');
      navigate(`/auctions/${id}`);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h1>
          <Link to="/auctions" className="text-rose-600 hover:text-rose-700">
            ← Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  // Check if auction is still active
  const isAuctionActive = new Date(auction.auction_end) > new Date();

  if (!isAuctionActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Has Ended</h1>
          <p className="text-gray-600 mb-6">This auction is no longer accepting bids.</p>
          <Link to={`/auctions/${id}`} className="text-rose-600 hover:text-rose-700">
            ← View Auction Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            to={`/auctions/${id}`} 
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auction Details
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Place Your Bid</h1>
            <p className="text-gray-600">
              {auction.listing?.title} in {auction.listing?.city}
            </p>
          </div>

          {/* Current Auction Status */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Current Highest Bid</div>
                <div className="text-2xl font-bold text-gray-900">{formatPrice(auction.current_bid)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Buyout Price</div>
                <div className="text-xl font-semibold text-green-600">{formatPrice(auction.buyout_price)}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Total bids placed: <span className="font-medium">{auction.bids?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Bid Form */}
          <form onSubmit={handleBidSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Bid Amount (₫)
              </label>
              <input
                type="number"
                required
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  bidAmount && !isValidBid(parseInt(bidAmount)) 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                }`}
                placeholder={`Minimum: ${formatPrice(getMinimumBid())}`}
              />
              {bidAmount && !isValidBid(parseInt(bidAmount)) ? (
                <p className="mt-2 text-sm text-red-600">
                  ⚠️ {parseInt(bidAmount) < getMinimumBid() 
                    ? `Bid too low. Minimum required: ${formatPrice(getMinimumBid())}` 
                    : `Bid too high. Must be less than buyout price: ${formatPrice(auction.buyout_price)}`}
                </p>
              ) : bidAmount && isValidBid(parseInt(bidAmount)) ? (
                <p className="mt-2 text-sm text-green-600">
                  ✅ Valid bid amount
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  Your bid must be at least {formatPrice(getMinimumIncrement(auction.current_bid))} higher than the current bid of {formatPrice(auction.current_bid)} and less than the buyout price of {formatPrice(auction.buyout_price)}. You can bid any amount between {formatPrice(getMinimumBid())} and {formatPrice(auction.buyout_price - 1)}.
                </p>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Bid Rules */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Bidding Rules</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All bids are binding and cannot be retracted</li>
                <li>• You must complete payment within 24 hours if you win</li>
                <li>• Minimum increment: {formatPrice(getMinimumIncrement(auction.current_bid))} above current bid (you can bid any amount above this)</li>
                <li>• You cannot bid on your own auction</li>
                <li>• Consider using buyout for guaranteed booking</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => navigate(`/auctions/${id}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !bidAmount || !isValidBid(parseInt(bidAmount))}
                className="px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Placing Bid...' : `Place Bid - ${bidAmount ? formatPrice(parseInt(bidAmount)) : '₫0'}`}
              </button>
            </div>
          </form>

          {/* Alternative Option */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Skip the auction and book immediately?</p>
            {auction.current_bid < auction.buyout_price ? (
              <Link
                to={`/auctions/${id}/buyout`}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Buy Now - {formatPrice(auction.buyout_price)}
              </Link>
            ) : (
              <div className="inline-flex items-center px-6 py-3 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed opacity-60">
                Buy Now Unavailable - Current bid exceeds buyout price
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionBidPage;