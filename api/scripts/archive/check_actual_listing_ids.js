require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const checkActualListingIds = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const DB_URL = process.env.DB_URL;
      console.log('Connecting to DB...');
      mongoose.set('strictQuery', false);
      await mongoose.connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    console.log('=== Checking Actual Listing IDs in Database ===');
    
    // Get a sample of listing_ids directly from the database
    const listings = await Listing.find({}).limit(10).select('listing_id title');
    
    console.log('\n📋 Sample listing_ids from database:');
    listings.forEach((listing, i) => {
      console.log(`${i+1}. ID: ${listing.listing_id} (type: ${typeof listing.listing_id})`);
      console.log(`   Title: ${listing.title?.substring(0, 50)}...`);
      if (typeof listing.listing_id === 'object') {
        console.log(`   Object structure:`, JSON.stringify(listing.listing_id));
      }
    });
    
    // Check if the aggregation is returning different IDs than what's in the database
    console.log('\n🧪 Testing simple aggregation (no lookup):');
    const simpleAgg = await Listing.aggregate([
      { $limit: 5 },
      { $project: { listing_id: 1, title: 1 } }
    ]);
    
    console.log('Simple aggregation result:');
    simpleAgg.forEach((item, i) => {
      console.log(`${i+1}. ID: ${JSON.stringify(item.listing_id)} | Title: ${item.title?.substring(0, 50)}...`);
    });

    // Test aggregation with just lookup (no filtering)
    console.log('\n🔍 Testing aggregation with lookup only:');
    const lookupAgg = await Listing.aggregate([
      { $limit: 3 },
      {
        $lookup: {
          from: 'images',
          localField: 'listing_id',
          foreignField: 'listing_id',
          as: 'images'
        }
      },
      {
        $project: {
          listing_id: 1,
          title: 1,
          imageCount: { $size: '$images' }
        }
      }
    ]);
    
    console.log('Lookup aggregation result:');
    lookupAgg.forEach((item, i) => {
      console.log(`${i+1}. ID: ${JSON.stringify(item.listing_id)} | Images: ${item.imageCount} | Title: ${item.title?.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (process.argv.includes('--close')) {
      mongoose.connection.close();
    }
  }
};

if (require.main === module) {
  checkActualListingIds();
}

module.exports = checkActualListingIds;