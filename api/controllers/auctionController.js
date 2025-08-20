const AuctionRequest = require('../models/AuctionRequest');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Image = require('../models/Image');
const Order = require('../models/Order');
const Availability = require('../models/Availability');

// Helper function to create order for auction winner
const createAuctionOrder = async (auction, winnerId, finalPrice, orderType = 'auction') => {
  try {
    // Get winner and listing details
    const winner = await User.findOne({ user_id: winnerId });
    const listing = await Listing.findOne({ listing_id: auction.listing_id });
    
    if (!winner || !listing) {
      throw new Error('Winner or listing not found');
    }

    // Calculate number of nights
    const checkInDate = new Date(auction.check_in_date);
    const checkOutDate = new Date(auction.check_out_date);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Create the order
    const order = await Order.create({
      listing_id: auction.listing_id,
      user_id: winnerId,
      check_in: checkInDate,
      check_out: checkOutDate,
      num_of_guests: listing.person_capacity || 1,
      guest_name: `${winner.first_name} ${winner.last_name}`.trim() || 'Auction Winner',
      guest_phone: winner.phone || 'Not provided',
      total_price: finalPrice,
      status: 'pending', // Pending payment processing
      auction_id: auction._id,
      order_type: orderType, // 'auction' or 'buyout'
      notes: `${orderType === 'buyout' ? 'Buyout' : 'Auction'} winner - Final price: ${finalPrice}₫`
    });

    // Update availability (block the dates)
    await updateAvailabilityForOrder(auction.listing_id, checkInDate, checkOutDate);

    return order;
  } catch (error) {
    console.error('Error creating auction order:', error);
    throw error;
  }
};

// Helper function to update availability
const updateAvailabilityForOrder = async (listingId, checkIn, checkOut) => {
  try {
    const currentDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    while (currentDate < endDate) {
      await Availability.updateOne(
        { 
          listing_id: listingId,
          date: new Date(currentDate)
        },
        { 
          listing_id: listingId,
          date: new Date(currentDate),
          available: false,
          reserved: true,
          updated_at: new Date()
        },
        { upsert: true }
      );
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

// Helper function to send auction completion notifications
const sendAuctionNotifications = async (auction, winnerId, finalPrice, type = 'auction') => {
  try {
    // TODO: Implement email/SMS notifications
    // For now, just log the notifications that should be sent
    console.log(`🎉 ${type.toUpperCase()} COMPLETED:`, {
      auction_id: auction._id,
      listing_id: auction.listing_id,
      winner_id: winnerId,
      final_price: finalPrice,
      check_in: auction.check_in_date,
      check_out: auction.check_out_date
    });
    
    // Notifications to implement:
    // 1. Winner notification: "Congratulations! You won the auction"
    // 2. Host notification: "Your auction has ended, winner found"
    // 3. Other bidders: "Auction has ended, you were outbid"
    
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

// Host submits auction request
exports.requestAuction = async (req, res) => {
  try {
    const userData = req.user;
    const { 
      listing_id, 
      check_in_date, 
      check_out_date, 
      auction_duration_days, 
      auction_start_date, 
      auction_end_date, 
      total_nights, 
      starting_price, 
      buyout_price 
    } = req.body;

    // Validate required fields
    if (!listing_id || !check_in_date || !check_out_date || !auction_duration_days || 
        !auction_start_date || !auction_end_date || !total_nights || 
        !starting_price || !buyout_price) {
      return res.status(400).json({
        message: 'All fields are required: listing_id, check_in_date, check_out_date, auction_duration_days, auction_start_date, auction_end_date, total_nights, starting_price, buyout_price'
      });
    }

    // Validate date logic
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const auctionStart = new Date(auction_start_date);
    const auctionEnd = new Date(auction_end_date);
    const today = new Date();

    // Check minimum lead time (21 days)
    const minCheckIn = new Date();
    minCheckIn.setDate(minCheckIn.getDate() + 21);
    if (checkIn < minCheckIn) {
      return res.status(400).json({
        message: 'Check-in date must be at least 21 days from today (14 days auction + 7 days buffer)'
      });
    }

    // Check if check-out is after check-in
    if (checkOut <= checkIn) {
      return res.status(400).json({
        message: 'Check-out date must be after check-in date'
      });
    }

    // Validate 7-day buffer rule
    const bufferDate = new Date(checkIn);
    bufferDate.setDate(bufferDate.getDate() - 7);
    if (auctionEnd > bufferDate) {
      return res.status(400).json({
        message: 'Auction must end at least 7 days before check-in date'
      });
    }

    // Validate auction timing
    if (auctionStart >= auctionEnd) {
      return res.status(400).json({
        message: 'Auction start date must be before auction end date'
      });
    }

    if (auctionStart <= today) {
      return res.status(400).json({
        message: 'Auction cannot start in the past'
      });
    }

    // Validate total nights calculation
    const calculatedNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (total_nights !== calculatedNights) {
      return res.status(400).json({
        message: 'Total nights must match the difference between check-in and check-out dates'
      });
    }

    // Validate auction duration
    if (![7, 14, 21, 30].includes(parseInt(auction_duration_days))) {
      return res.status(400).json({
        message: 'Auction duration must be 7, 14, 21, or 30 days'
      });
    }

    // Validate prices
    if (starting_price <= 0 || buyout_price <= 0) {
      return res.status(400).json({
        message: 'Starting price and buyout price must be greater than 0'
      });
    }

    if (buyout_price <= starting_price) {
      return res.status(400).json({
        message: 'Buyout price must be higher than starting price'
      });
    }

    // Check if listing belongs to the host
    const listing = await Listing.findOne({ listing_id: listing_id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({
        message: 'You can only request auctions for your own listings'
      });
    }

    // Check if there's already a pending request for this listing
    const existingRequest = await AuctionRequest.findOne({
      listing_id: listing_id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'There is already a pending auction request for this listing'
      });
    }

    // Create auction request
    const auctionRequest = new AuctionRequest({
      listing_id,
      host_id: userData.user_id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      auction_duration_days: parseInt(auction_duration_days),
      auction_start_date: auctionStart,
      auction_end_date: auctionEnd,
      total_nights: parseInt(total_nights),
      starting_price: Number(starting_price),
      buyout_price: Number(buyout_price)
    });

    await auctionRequest.save();

    res.status(201).json({
      message: 'Auction request submitted successfully',
      request: auctionRequest
    });

  } catch (error) {
    console.error('Request auction error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get auction requests for host
exports.getHostAuctionRequests = async (req, res) => {
  try {
    const userData = req.user;

    const requests = await AuctionRequest.find({
      host_id: userData.user_id
    }).sort({ created_at: -1 });

    res.status(200).json(requests);

  } catch (error) {
    console.error('Get host auction requests error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Admin: Get all pending auction requests
exports.getPendingAuctionRequests = async (req, res) => {
  try {
    const requests = await AuctionRequest.find({
      status: 'pending'
    }).sort({ created_at: -1 });

    // Populate listing and host information
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const listing = await Listing.findOne({ listing_id: request.listing_id });
        const host = await User.findOne({ user_id: request.host_id });
        const firstImage = await Image.findOne({ listing_id: request.listing_id });

        return {
          ...request.toObject(),
          listing: {
            title: listing?.title || 'Unknown',
            city: listing?.city || 'Unknown',
            nightly_price: listing?.nightly_price || 0,
            firstImage: firstImage || null
          },
          host: {
            name: host?.name || 'Unknown',
            email: host?.email || 'Unknown'
          }
        };
      })
    );

    res.status(200).json(populatedRequests);

  } catch (error) {
    console.error('Get pending auction requests error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Admin: Approve/Reject auction request
exports.updateAuctionRequestStatus = async (req, res) => {
  try {
    const userData = req.user;
    const { requestId } = req.params;
    const { status, admin_notes } = req.body;

    // Check if user is admin
    if (userData.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can approve/reject auction requests'
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be either approved or rejected'
      });
    }

    const request = await AuctionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        message: 'Auction request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending requests can be updated'
      });
    }

    // Update request status
    request.status = status;
    request.admin_notes = admin_notes || '';
    request.approved_at = new Date();
    request.approved_by = userData.user_id;
    await request.save();

    // If approved, create active auction
    if (status === 'approved') {
      // Validate that auction timing is still valid
      const now = new Date();
      const auctionStart = new Date(request.auction_start_date);
      const auctionEnd = new Date(request.auction_end_date);
      const checkIn = new Date(request.check_in_date);
      
      // Check if auction can still start in the future
      if (auctionStart <= now) {
        return res.status(400).json({
          message: 'Auction start date has passed. Please request a new auction with updated dates.'
        });
      }
      
      // Double-check 7-day buffer rule
      const bufferDate = new Date(checkIn);
      bufferDate.setDate(bufferDate.getDate() - 7);
      if (auctionEnd > bufferDate) {
        return res.status(400).json({
          message: 'Auction timing no longer valid. Auction must end at least 7 days before check-in.'
        });
      }

      const auction = new Auction({
        listing_id: request.listing_id,
        host_id: request.host_id,
        auction_start: auctionStart,
        auction_end: auctionEnd,
        check_in_date: request.check_in_date,
        check_out_date: request.check_out_date,
        total_nights: request.total_nights,
        starting_price: request.starting_price,
        buyout_price: request.buyout_price,
        current_bid: request.starting_price
      });

      await auction.save();
    }

    res.status(200).json({
      message: `Auction request ${status} successfully`,
      request: request
    });

  } catch (error) {
    console.error('Update auction request status error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get active auctions for users
exports.getActiveAuctions = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const auctions = await Auction.find({
      status: 'active',
      auction_end: { $gt: new Date() }
    })
    .sort({ created_at: -1 })
    .skip(Number(offset))
    .limit(Number(limit));

    // Populate listing and host information
    const populatedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        const listing = await Listing.findOne({ listing_id: auction.listing_id });
        const host = await User.findOne({ user_id: auction.host_id });
        const firstImage = await Image.findOne({ listing_id: auction.listing_id });
        const bidCount = await Bid.countDocuments({ auction_id: auction._id });

        return {
          ...auction.toObject(),
          listing: {
            title: listing?.title || 'Unknown',
            description: listing?.description || '',
            city: listing?.city || 'Unknown',
            person_capacity: listing?.person_capacity || 1,
            room_type: listing?.room_type || 'Unknown',
            firstImage: firstImage || null
          },
          host: {
            name: host?.name || 'Unknown'
          },
          bid_count: bidCount,
          time_remaining: auction.auction_end - new Date()
        };
      })
    );

    res.status(200).json(populatedAuctions);

  } catch (error) {
    console.error('Get active auctions error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Place a bid on an auction
exports.placeBid = async (req, res) => {
  try {
    const userData = req.user;
    const { auctionId } = req.params;
    const { bid_amount } = req.body;

    if (!bid_amount || bid_amount <= 0) {
      return res.status(400).json({
        message: 'Bid amount must be greater than 0'
      });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found'
      });
    }

    // Check if auction is still active
    if (auction.status !== 'active' || auction.auction_end <= new Date()) {
      return res.status(400).json({
        message: 'This auction is no longer active'
      });
    }

    // Check if host is trying to bid on own auction
    if (auction.host_id === userData.user_id) {
      return res.status(400).json({
        message: 'You cannot bid on your own auction'
      });
    }

    // Check if bid is higher than current bid
    if (bid_amount <= auction.current_bid) {
      return res.status(400).json({
        message: `Bid must be higher than current bid of ${auction.current_bid}₫`
      });
    }

    // Check if bid would exceed or equal buyout price
    if (bid_amount >= auction.buyout_price) {
      return res.status(400).json({
        message: `Bid cannot exceed or equal the buyout price of ${auction.buyout_price}₫. Consider using the buyout option instead.`
      });
    }

    // Create new bid
    const bid = new Bid({
      auction_id: auction._id,
      bidder_id: userData.user_id,
      bid_amount: Number(bid_amount),
      is_winning: true
    });

    // Update previous winning bids
    await Bid.updateMany(
      { auction_id: auction._id, is_winning: true },
      { is_winning: false, status: 'outbid' }
    );

    await bid.save();

    // Update auction
    auction.current_bid = Number(bid_amount);
    auction.highest_bidder = userData.user_id;
    auction.total_bids += 1;
    await auction.save();

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: bid,
      auction: {
        current_bid: auction.current_bid,
        total_bids: auction.total_bids
      }
    });

  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get auction details
exports.getAuctionDetails = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found'
      });
    }

    // Get listing details
    const listing = await Listing.findOne({ listing_id: auction.listing_id });
    const host = await User.findOne({ user_id: auction.host_id });
    const firstImage = await Image.findOne({ listing_id: auction.listing_id });

    // Get bid history
    const bids = await Bid.find({ auction_id: auction._id })
      .sort({ bid_time: -1 })
      .limit(10);

    const populatedBids = await Promise.all(
      bids.map(async (bid) => {
        const bidder = await User.findOne({ user_id: bid.bidder_id });
        return {
          ...bid.toObject(),
          bidder: {
            name: bidder?.name || 'Anonymous'
          }
        };
      })
    );

    const auctionDetails = {
      ...auction.toObject(),
      listing: {
        title: listing?.title || 'Unknown',
        description: listing?.description || '',
        city: listing?.city || 'Unknown',
        person_capacity: listing?.person_capacity || 1,
        room_type: listing?.room_type || 'Unknown',
        latitude: listing?.latitude || 0,
        longitude: listing?.longitude || 0,
        firstImage: firstImage || null
      },
      host: {
        name: host?.name || 'Unknown'
      },
      bids: populatedBids,
      time_remaining: auction.auction_end - new Date()
    };

    res.status(200).json(auctionDetails);

  } catch (error) {
    console.error('Get auction details error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Buyout auction (instant purchase)
exports.buyoutAuction = async (req, res) => {
  try {
    const userData = req.user;
    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found'
      });
    }

    // Check if auction is still active
    if (auction.status !== 'active' || auction.auction_end <= new Date()) {
      return res.status(400).json({
        message: 'This auction is no longer active'
      });
    }

    // Check if host is trying to buyout own auction
    if (auction.host_id === userData.user_id) {
      return res.status(400).json({
        message: 'You cannot buyout your own auction'
      });
    }

    // Check if current bid has already exceeded or matched buyout price
    if (auction.current_bid >= auction.buyout_price) {
      return res.status(400).json({
        message: 'Buyout is no longer available as the current bid has exceeded or matched the buyout price'
      });
    }

    // End the auction immediately
    auction.status = 'ended';
    auction.current_bid = auction.buyout_price;
    auction.highest_bidder = userData.user_id;
    await auction.save();

    // Create order for the buyout winner
    let order = null;
    try {
      order = await createAuctionOrder(auction, userData.user_id, auction.buyout_price, 'buyout');
      
      // Send notifications
      await sendAuctionNotifications(auction, userData.user_id, auction.buyout_price, 'buyout');
      
    } catch (orderError) {
      console.error('Error creating order for buyout:', orderError);
      // Still return success for auction completion, but note the order issue
    }

    res.status(200).json({
      message: 'Buyout successful! The auction has been completed and your booking order has been created.',
      auction: {
        _id: auction._id,
        final_price: auction.buyout_price,
        winner: userData.user_id,
        status: 'ended'
      },
      order: order ? {
        order_id: order.order_id,
        total_price: order.total_price,
        status: order.status,
        expires_at: order.expires_at
      } : null,
      next_steps: order ? 
        'Please complete your payment within 30 minutes to confirm your booking.' :
        'There was an issue creating your booking order. Please contact support.'
    });

  } catch (error) {
    console.error('Buyout auction error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Process ended auctions and determine winners
exports.processEndedAuctions = async () => {
  try {
    console.log('🔍 Checking for ended auctions...');
    
    // Find auctions that have ended but are still marked as active
    const endedAuctions = await Auction.find({
      status: 'active',
      auction_end: { $lte: new Date() }
    });

    console.log(`Found ${endedAuctions.length} ended auctions to process`);

    for (const auction of endedAuctions) {
      try {
        // Update auction status
        auction.status = 'ended';
        
        // If there's a highest bidder, create an order for them
        if (auction.highest_bidder) {
          console.log(`Processing auction ${auction._id} with winner ${auction.highest_bidder}`);
          
          const order = await createAuctionOrder(
            auction, 
            auction.highest_bidder, 
            auction.current_bid, 
            'auction'
          );
          
          // Send notifications
          await sendAuctionNotifications(
            auction, 
            auction.highest_bidder, 
            auction.current_bid, 
            'auction'
          );
          
          console.log(`✅ Created order ${order.order_id} for auction winner`);
        } else {
          console.log(`⚠️ Auction ${auction._id} ended with no bids`);
        }
        
        await auction.save();
        
      } catch (auctionError) {
        console.error(`❌ Error processing auction ${auction._id}:`, auctionError);
      }
    }
    
    return endedAuctions.length;
  } catch (error) {
    console.error('❌ Error processing ended auctions:', error);
    throw error;
  }
};

// Manual endpoint to process ended auctions (for testing)
exports.processEndedAuctionsEndpoint = async (req, res) => {
  try {
    const processedCount = await exports.processEndedAuctions();
    
    res.status(200).json({
      success: true,
      message: `Processed ${processedCount} ended auctions`,
      processed_count: processedCount
    });
  } catch (error) {
    console.error('Error in manual auction processing:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing ended auctions',
      error: error.message
    });
  }
};

