require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const debugImageAggregation = async () => {
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

    console.log('=== Debug Image Aggregation ===');
    
    // Test 1: Check sample listing IDs format
    console.log('\\n1. Sample listing IDs:');
    const sampleListings = await Listing.find({}).limit(3);
    sampleListings.forEach((listing, i) => {
      console.log(`  ${i+1}. ${listing.listing_id} (${typeof listing.listing_id})`);
    });

    // Test 2: Check sample image IDs format
    console.log('\\n2. Sample image listing_ids:');
    const sampleImages = await Image.find({}).limit(3);
    sampleImages.forEach((img, i) => {
      console.log(`  ${i+1}. ${img.listing_id} (${typeof img.listing_id}) - ${img.url}`);
    });

    // Test 3: Try the aggregation
    console.log('\\n3. Testing aggregation with sample listing:');
    if (sampleListings.length > 0) {
      const testListing = sampleListings[0];
      console.log(`Testing with listing_id: ${testListing.listing_id}`);
      
      const result = await Listing.aggregate([
        { $match: { _id: testListing._id } },
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
        }
      ]);
      
      console.log('Aggregation result:');
      if (result.length > 0) {
        console.log(`  - Images found: ${result[0].imageCount}`);
        console.log(`  - Has images: ${result[0].hasImages}`);
        if (result[0].images.length > 0) {
          console.log(`  - First image: ${result[0].images[0].url}`);
        }
      }
    }

    // Test 4: Find listings that actually have images
    console.log('\\n4. Finding listings with images:');
    const listingsWithImages = await Listing.aggregate([
      {
        $lookup: {
          from: 'images',
          localField: 'listing_id',
          foreignField: 'listing_id',
          as: 'images'
        }
      },
      {
        $match: { 'images.0': { $exists: true } }
      },
      { $limit: 5 },
      {
        $project: {
          listing_id: 1,
          title: 1,
          imageCount: { $size: '$images' }
        }
      }
    ]);

    console.log('Listings with images:');
    listingsWithImages.forEach((listing, i) => {
      console.log(`  ${i+1}. ID: ${listing.listing_id} | Images: ${listing.imageCount} | Title: ${listing.title?.substring(0, 50)}...`);
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
  debugImageAggregation();
}

module.exports = debugImageAggregation;