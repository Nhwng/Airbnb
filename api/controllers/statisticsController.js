// controllers/statisticsController.js
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const Listing = require('../models/Listing');
const User = require('../models/User');

// KHÔNG kiểm tra admin/login
function parseRange(query) {
  const { from, to } = query;
  const $gte = from ? new Date(from) : new Date('2000-01-01');
  const $lte = to ? new Date(to) : new Date(); // now
  return { $gte, $lte };
}

/**
 * GET /statistics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
exports.getOverview = async (req, res) => {
  try {
    const range = parseRange(req.query);

    const [revAgg] = await Payment.aggregate([
      { $match: { status: 'completed', created_at: { $gte: range.$gte, $lte: range.$lte } } },
      { $group: { _id: null, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const ordersByStatus = await Order.aggregate([
      { $match: { created_at: { $gte: range.$gte, $lte: range.$lte } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const reservationsByStatus = await Reservation.aggregate([
      { $match: { created_at: { $gte: range.$gte, $lte: range.$lte } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const activeListings = await Listing.countDocuments({});
    const totalCustomers = await User.countDocuments({});
    const paidOrders = await Order.countDocuments({
      status: 'paid',
      created_at: { $gte: range.$gte, $lte: range.$lte },
    });

    const totalRevenue = revAgg?.revenue || 0;
    const aov = paidOrders ? Math.round((totalRevenue / paidOrders) * 100) / 100 : 0;

    res.json({
      range,
      totals: {
        revenue: totalRevenue,
        paymentsCompleted: revAgg?.count || 0,
        orders: ordersByStatus.reduce((acc, x) => ({ ...acc, [x._id]: x.count }), {}),
        reservations: reservationsByStatus.reduce((acc, x) => ({ ...acc, [x._id]: x.count }), {}),
        activeListings,
        customers: totalCustomers,
        averageOrderValue: aov,
      },
    });
  } catch (err) {
    console.error('stats overview error', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /statistics/revenue-series?granularity=daily|monthly|quarterly|yearly&from&to
 */
exports.getRevenueSeries = async (req, res) => {
  try {
    const range = parseRange(req.query);
    const g = (req.query.granularity || 'monthly').toLowerCase();

    const dateExpr = '$created_at';
    const baseMatch = { status: 'completed', created_at: { $gte: range.$gte, $lte: range.$lte } };

    let groupId;
    if (g === 'daily') {
      groupId = { y: { $year: dateExpr }, m: { $month: dateExpr }, d: { $dayOfMonth: dateExpr } };
    } else if (g === 'quarterly') {
      groupId = { y: { $year: dateExpr }, q: { $ceil: { $divide: [{ $month: dateExpr }, 3] } } };
    } else if (g === 'yearly') {
      groupId = { y: { $year: dateExpr } };
    } else {
      groupId = { y: { $year: dateExpr }, m: { $month: dateExpr } }; // monthly
    }

    const series = await Payment.aggregate([
      { $match: baseMatch },
      { $group: { _id: groupId, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1, '_id.q': 1 } },
    ]);

    const items = series.map((s) => ({
      period:
        g === 'daily'
          ? `${s._id.y}-${String(s._id.m).padStart(2, '0')}-${String(s._id.d).padStart(2, '0')}`
          : g === 'quarterly'
          ? `Q${s._id.q} ${s._id.y}`
          : g === 'yearly'
          ? `${s._id.y}`
          : `${s._id.y}-${String(s._id.m).padStart(2, '0')}`,
      revenue: s.revenue,
      count: s.count,
    }));

    res.json({ granularity: g, items });
  } catch (err) {
    console.error('stats revenue-series error', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /statistics/top-listings?limit=5
 */
exports.getTopListings = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 50);

    const data = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $group: { _id: '$order.listing_id', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'listings',
          localField: '_id',
          foreignField: 'listing_id',
          as: 'listing',
        },
      },
      { $unwind: { path: '$listing', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          listing_id: '$_id',
          title: '$listing.title',
          city: '$listing.city',
          revenue: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ items: data });
  } catch (err) {
    console.error('stats top-listings error', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /statistics/customers?limit=10
 */
exports.getTopCustomers = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const data = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$user_id', revenue: { $sum: '$amount' }, payments: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'user_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          user_id: '$_id',
          name: { $concat: ['$user.first_name', ' ', '$user.last_name'] },
          revenue: 1,
          payments: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ items: data });
  } catch (err) {
    console.error('stats customers error', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /statistics/catalog
 */
exports.getCatalogStats = async (req, res) => {
  try {
    const byRoomType = await Listing.aggregate([
      { $group: { _id: '$room_type', listings: { $sum: 1 }, avgPrice: { $avg: '$nightly_price' } } },
      { $sort: { listings: -1 } },
    ]);

    const byCity = await Listing.aggregate([
      { $group: { _id: '$city', listings: { $sum: 1 }, avgPrice: { $avg: '$nightly_price' } } },
      { $sort: { listings: -1 } },
      { $limit: 10 },
    ]);

    res.json({ byRoomType, byCity });
  } catch (err) {
    console.error('stats catalog error', err);
    res.status(500).json({ message: err.message });
  }
};
