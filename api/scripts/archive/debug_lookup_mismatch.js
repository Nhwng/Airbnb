require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const debugLookupMismatch = async () => {
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

    console.log('=== Debugging $lookup Mismatch ===');
    
    // The specific listing that aggregation says has 164 images but direct query shows 0
    const complexId = { low: -1006996836, high: 329070233, unsigned: false };
    
    // Helper function
    const extractListingId = (listing_id) => {
      if (typeof listing_id === 'object' && listing_id !== null) {
        if (listing_id.low !== undefined && listing_id.high !== undefined) {
          if (listing_id.unsigned === false && listing_id.high < 0) {
            return listing_id.low + (listing_id.high * Math.pow(2, 32));
          } else {
            return (listing_id.low >>> 0) + (listing_id.high * Math.pow(2, 32));
          }
        }
      }
      return listing_id;
    };
    
    const extractedId = extractListingId(complexId);
    console.log(`Complex ID: ${JSON.stringify(complexId)}`);
    console.log(`Extracted ID: ${extractedId}`);
    
    // Check how this listing_id is stored in the database
    console.log('\n1. Finding listing in database:');
    const listing = await Listing.findOne({ listing_id: extractedId });
    if (listing) {
      console.log(`✅ Found listing: ${listing.title}`);
      console.log(`   DB listing_id type: ${typeof listing.listing_id}`);
      console.log(`   DB listing_id value: ${listing.listing_id}`);
    } else {
      console.log(`❌ Listing not found with ID: ${extractedId}`);
      
      // Try finding with the complex object format
      const listingComplex = await Listing.findOne({ listing_id: complexId });
      if (listingComplex) {
        console.log(`✅ Found listing with complex ID: ${listingComplex.title}`);
        console.log(`   DB listing_id: ${JSON.stringify(listingComplex.listing_id)}`);
      }
    }
    
    // Check images directly
    console.log('\n2. Checking images directly:');
    const images1 = await Image.find({ listing_id: extractedId });
    console.log(`   Images with extracted ID (${extractedId}): ${images1.length}`);
    
    const images2 = await Image.find({ listing_id: complexId });
    console.log(`   Images with complex ID: ${images2.length}`);
    
    // Test the exact aggregation on this specific listing
    console.log('\n3. Testing aggregation on this specific listing:');
    const aggResult = await Listing.aggregate([
      { $match: { listing_id: extractedId } },
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
        $project: {
          listing_id: 1,
          title: 1,
          imageCount: 1,
          hasImages: 1
        }
      }
    ]);
    
    if (aggResult.length > 0) {
      const result = aggResult[0];
      console.log(`   Aggregation result:`);
      console.log(`   - imageCount: ${result.imageCount}`);
      console.log(`   - hasImages: ${result.hasImages}`);
      console.log(`   - listing_id: ${JSON.stringify(result.listing_id)}`);
    } else {
      console.log(`   ❌ No aggregation result found`);
    }
    
    // Check what IDs actually exist in images collection
    console.log('\n4. Sample image listing_ids:');
    const sampleImages = await Image.find({}).limit(5).select('listing_id');
    sampleImages.forEach((img, i) => {
      console.log(`   ${i+1}. Image listing_id: ${img.listing_id} (type: ${typeof img.listing_id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

if (require.main === module) {
  debugLookupMismatch();
}

module.exports = debugLookupMismatch;