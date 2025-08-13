require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const findValidImages = async () => {
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

    console.log('=== Finding Valid Images ===');
    
    // Find images that have valid listing_ids (not undefined)
    const validImages = await Image.find({ 
      listing_id: { $exists: true, $ne: null, $type: "number" } 
    }).limit(10);
    
    console.log(`\n✅ Found ${validImages.length} images with valid listing_ids:`);
    validImages.forEach((image, i) => {
      console.log(`${i+1}. listing_id: ${image.listing_id} | URL: ${image.url?.substring(0, 50)}...`);
    });
    
    // Count images with invalid listing_ids
    const invalidImages = await Image.countDocuments({ 
      $or: [
        { listing_id: { $exists: false } },
        { listing_id: null },
        { listing_id: undefined }
      ]
    });
    
    console.log(`\n❌ Images with invalid listing_ids: ${invalidImages}`);
    
    // Check if these valid images match any listings
    if (validImages.length > 0) {
      console.log(`\n🔍 Checking if valid images match listings:`);
      for (let i = 0; i < Math.min(5, validImages.length); i++) {
        const image = validImages[i];
        const listing = await Listing.findOne({ listing_id: image.listing_id });
        if (listing) {
          console.log(`  ✅ listing_id ${image.listing_id} has matching listing: ${listing.title?.substring(0, 40)}...`);
        } else {
          console.log(`  ❌ listing_id ${image.listing_id} has NO matching listing`);
        }
      }
    }
    
    // Now test the aggregation with a specific valid listing_id
    if (validImages.length > 0) {
      const testListingId = validImages[0].listing_id;
      console.log(`\n🧪 Testing aggregation for specific listing_id: ${testListingId}`);
      
      const pipeline = [
        { $match: { listing_id: testListingId } },
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
      ];
      
      const result = await Listing.aggregate(pipeline);
      console.log(`Result for specific listing:`, result);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (process.argv.includes('--close')) {
      mongoose.connection.close();
    }
  }
};

if (require.main === module) {
  findValidImages();
}

module.exports = findValidImages;