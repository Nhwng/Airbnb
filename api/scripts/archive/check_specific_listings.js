require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const checkSpecificListings = async () => {
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

    console.log('=== Checking Specific Listings from API Response ===');
    
    // These are the listing IDs from the actual API response
    const listingIds = [
      21128578, // Simple number
      { low: -1988674583, high: 280681156, unsigned: false }, // Complex format
      { low: 1798830821, high: 327740370, unsigned: false },
      { low: -1640646854, high: 342419220, unsigned: false },
      { low: -2009886278, high: 215376734, unsigned: false }
    ];

    // Function to convert complex format to actual number
    const extractListingId = (listing_id) => {
      if (typeof listing_id === 'object' && listing_id !== null) {
        if (listing_id.low !== undefined) {
          return listing_id.high === 0 
            ? listing_id.low 
            : (listing_id.low >>> 0) + (listing_id.high * Math.pow(2, 32));
        }
      }
      return listing_id;
    };

    for (let i = 0; i < listingIds.length; i++) {
      const originalId = listingIds[i];
      const actualId = extractListingId(originalId);
      
      console.log(`\n${i+1}. Checking listing_id: ${JSON.stringify(originalId)}`);
      console.log(`   Extracted ID: ${actualId}`);
      
      // Check if listing exists
      const listing = await Listing.findOne({ listing_id: actualId });
      if (!listing) {
        console.log(`   ❌ Listing not found in database`);
        continue;
      }
      
      // Check images for this listing
      const images = await Image.find({ listing_id: actualId });
      console.log(`   📊 Images found: ${images.length}`);
      
      if (images.length === 0) {
        console.log(`   ❌ NO IMAGES - This should not appear with withImages=true!`);
      } else {
        console.log(`   ✅ Has images - correctly filtered`);
      }
    }

    // Now let's test the exact aggregation pipeline from the controller
    console.log('\n=== Testing Controller Aggregation Pipeline ===');
    
    const pipeline = [
      { $match: {} }, // No filters for featured=true case
      {
        $lookup: {
          from: 'images',
          localField: 'listing_id',
          foreignField: 'listing_id',
          as: 'images'
        }
      },
      {
        $addFields: {
          imageCount: { $size: '$images' },
          hasImages: { $gt: [{ $size: '$images' }, 0] }
        }
      },
      {
        $match: { hasImages: true } // withImages=true filter
      },
      {
        $sort: {
          hasImages: -1,
          imageCount: -1,
          created_at: -1
        }
      },
      { $sample: { size: 5 } }, // Same as featured=true
      {
        $project: {
          listing_id: 1,
          title: 1,
          imageCount: 1,
          hasImages: 1
        }
      }
    ];

    const result = await Listing.aggregate(pipeline);
    console.log(`\nController pipeline result: ${result.length} listings`);
    result.forEach((listing, i) => {
      console.log(`  ${i+1}. ID: ${listing.listing_id} | Images: ${listing.imageCount} | Has: ${listing.hasImages} | Title: ${listing.title?.substring(0, 50)}...`);
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
  checkSpecificListings();
}

module.exports = checkSpecificListings;