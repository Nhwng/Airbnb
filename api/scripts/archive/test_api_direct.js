require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const testAPIDirect = async () => {
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

    console.log('=== Testing API Logic Directly ===');
    
    // Simulate the exact parameters from the API call
    const limit = 5;
    const featured = 'true';
    const withImages = 'true';
    
    console.log(`Parameters: limit=${limit}, featured=${featured}, withImages=${withImages}`);
    
    // Build match filter object (empty for featured)
    let matchFilter = {};
    
    // Build aggregation pipeline exactly as in controller
    const pipeline = [
      { $match: matchFilter },
      // Lookup images for each listing
      {
        $lookup: {
          from: 'images',
          localField: 'listing_id',
          foreignField: 'listing_id',
          as: 'images'
        }
      },
      // Add field to count images and determine if listing has images
      {
        $addFields: {
          imageCount: { $size: '$images' },
          hasImages: { $gt: [{ $size: '$images' }, 0] }
        }
      }
    ];

    // Filter only listings with images if withImages is true
    if (withImages === 'true') {
      pipeline.push({
        $match: { hasImages: true }
      });
      console.log('✅ Added withImages=true filter');
    }

    // Sort: prioritize listings with images, then by image count, then by creation date
    pipeline.push({
      $sort: {
        hasImages: -1,    // Listings with images first
        imageCount: -1,   // More images first
        created_at: -1    // Newest first
      }
    });

    // Handle featured vs regular listings
    if (featured === 'true') {
      // For featured listings, sample from those with images
      pipeline.push({ $sample: { size: Number(limit) } });
      console.log('✅ Added $sample for featured listings');
    } else {
      // Regular pagination
      pipeline.push(
        { $skip: 0 },
        { $limit: Number(limit) }
      );
    }

    // Remove the images array from response to keep it clean (images will be fetched separately)
    pipeline.push({
      $project: {
        images: 0,
        imageCount: 0,
        hasImages: 0
      }
    });

    console.log('\n📋 Final Pipeline:');
    console.log(JSON.stringify(pipeline, null, 2));

    console.log('\n🔍 Executing aggregation...');
    const listings = await Listing.aggregate(pipeline);

    console.log(`\n📊 Result: ${listings.length} listings found`);
    
    // Check each listing for images manually
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      console.log(`\n${i+1}. Listing ID: ${listing.listing_id}`);
      console.log(`   Title: ${listing.title?.substring(0, 50)}...`);
      
      // Manually check images for this listing to verify
      const Image = require('../models/Image');
      const images = await Image.find({ listing_id: listing.listing_id });
      console.log(`   🖼️  Manual image check: ${images.length} images found`);
      
      if (images.length === 0) {
        console.log(`   ❌ ERROR: This listing has NO images but was returned with withImages=true!`);
      } else {
        console.log(`   ✅ Correctly has images`);
      }
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
  testAPIDirect();
}

module.exports = testAPIDirect;