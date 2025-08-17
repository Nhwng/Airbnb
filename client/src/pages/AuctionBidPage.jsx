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
        
        // Set minimum bid amount (current bid + minimum increment)
        const minimumBid = data.current_bid + 10000; // 10,000₫ minimum increment
        setBidAmount(minimumBid.toString());
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

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const bidValue = parseInt(bidAmount);
      
      if (bidValue <= auction.current_bid) {
        throw new Error(`Bid must be higher than current bid of ${formatPrice(auction.current_bid)}`);
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
                min={auction.current_bid + 1}
                step="1000"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                placeholder={`Minimum: ${formatPrice(auction.current_bid + 10000)}`}
              />
              <p className="mt-2 text-sm text-gray-600">
                Minimum bid increment: 10,000₫. Your bid must be higher than {formatPrice(auction.current_bid)}.
              </p>
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
                <li>• Minimum bid increment is 10,000₫</li>
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
                disabled={submitting || !bidAmount || parseInt(bidAmount) <= auction.current_bid}
                className="px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Placing Bid...' : `Place Bid - ${bidAmount ? formatPrice(parseInt(bidAmount)) : '₫0'}`}
              </button>
            </div>
          </form>

          {/* Alternative Option */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Skip the auction and book immediately?</p>
            <Link
              to={`/auctions/${id}/buyout`}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Buy Now - {formatPrice(auction.buyout_price)}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionBidPage;