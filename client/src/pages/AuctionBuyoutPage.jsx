import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import axiosInstance from '@/utils/axios';
import { formatVND } from '@/utils';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const AuctionBuyoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
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


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBuyout = async () => {
    setError('');
    setProcessing(true);

    try {
      const response = await axiosInstance.post(`/auctions/${id}/buyout`);
      
      alert('Buyout successful! The auction has been completed and you are the winner.');
      navigate(`/auctions/${id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process buyout');
    } finally {
      setProcessing(false);
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
  const isBuyoutAvailable = auction.current_bid < auction.buyout_price;

  if (!isAuctionActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Has Ended</h1>
          <p className="text-gray-600 mb-6">This auction is no longer accepting buyouts.</p>
          <Link to={`/auctions/${id}`} className="text-rose-600 hover:text-rose-700">
            ← View Auction Details
          </Link>
        </div>
      </div>
    );
  }

  if (!isBuyoutAvailable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Buyout No Longer Available</h1>
          <p className="text-gray-600 mb-6">
            The current bid ({formatVND(auction.current_bid)}) has exceeded or matched the buyout price ({formatVND(auction.buyout_price)}).
          </p>
          <p className="text-gray-600 mb-6">
            You can still place a bid to compete in the auction.
          </p>
          <div className="space-y-3">
            <Link to={`/auctions/${id}/bid`} className="inline-block px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700">
              Place a Bid Instead
            </Link>
            <br />
            <Link to={`/auctions/${id}`} className="text-rose-600 hover:text-rose-700">
              ← View Auction Details
            </Link>
          </div>
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Instant Buyout</h1>
            <p className="text-gray-600">
              Skip the auction and book immediately
            </p>
          </div>

          {/* Property Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-4">
              {auction.listing?.firstImage && (
                <img 
                  src={auction.listing.firstImage.url}
                  alt={auction.listing.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {auction.listing?.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {auction.listing?.city} • {auction.listing?.person_capacity} guests
                </p>
                <div className="text-sm text-gray-600">
                  <div>Check-in: {auction.check_in_date ? formatDate(auction.check_in_date) : 'Not specified'}</div>
                  <div>Check-out: {auction.check_out_date ? formatDate(auction.check_out_date) : 'Not specified'}</div>
                  <div>Duration: {auction.total_nights || 'N/A'} nights</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Comparison */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-600 mb-1">Current Highest Bid</div>
                <div className="text-xl font-bold text-red-700">{formatVND(auction.current_bid)}</div>
                <div className="text-xs text-red-600 mt-1">
                  {auction.bids?.length || 0} competing bidders
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Buyout Price</div>
                <div className="text-2xl font-bold text-green-700">{formatVND(auction.buyout_price)}</div>
                <div className="text-xs text-green-600 mt-1">
                  Guaranteed booking
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-semibold text-green-900 mb-3">Buyout Benefits</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Immediate booking confirmation</span>
              </div>
              <div className="flex items-center text-sm text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>No competition from other bidders</span>
              </div>
              <div className="flex items-center text-sm text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Secure your preferred dates</span>
              </div>
              <div className="flex items-center text-sm text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Skip auction waiting period</span>
              </div>
            </div>
          </div>

          {/* Total Cost Breakdown */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Buyout price ({auction.total_nights || 'N/A'} nights)</span>
                <span className="font-medium">{formatVND(auction.buyout_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service fees</span>
                <span className="font-medium">Included</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatVND(auction.buyout_price)}</span>
                </div>
              </div>
            </div>
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
              onClick={handleBuyout}
              disabled={processing}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : `Buy Now - ${formatVND(auction.buyout_price)}`}
            </button>
          </div>

          {/* Alternative Option */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Want to try bidding for a lower price?</p>
            <Link
              to={`/auctions/${id}/bid`}
              className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              Place a Bid Instead
            </Link>
          </div>

          {/* Terms Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By proceeding with buyout, you agree to the booking terms and payment will be processed immediately. 
              This action will end the auction for all participants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionBuyoutPage;