require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const testRealAggregation = async () => {
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

    console.log('=== Testing Real Aggregation Pipeline ===');
    
    // Test the EXACT pipeline from the controller
    const withImages = 'true';
    const featured = 'true';
    const limit = 5;
    
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
      console.log('✅ Added hasImages filter');
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
      // For featured listings, use limit instead of sample to ensure filtering works
      pipeline.push({ $limit: Number(limit) });
      console.log('✅ Added limit for featured');
    }

    // BEFORE removing fields, let's see what we get
    console.log('\n🔍 Testing pipeline WITH debug fields:');
    const debugPipeline = [...pipeline];
    debugPipeline.push({
      $project: {
        listing_id: 1,
        title: 1,
        imageCount: 1,
        hasImages: 1
      }
    });

    const debugResult = await Listing.aggregate(debugPipeline);
    console.log(`Debug result: ${debugResult.length} listings`);
    debugResult.forEach((listing, i) => {
      console.log(`  ${i+1}. ID: ${JSON.stringify(listing.listing_id)} | Images: ${listing.imageCount} | hasImages: ${listing.hasImages} | Title: ${listing.title?.substring(0, 50)}...`);
    });

    // Now test the final pipeline (as used in controller)
    console.log('\n🔍 Testing FINAL pipeline (as in controller):');
    const finalPipeline = [...pipeline];
    finalPipeline.push({
      $project: {
        images: 0,
        imageCount: 0,
        hasImages: 0
      }
    });

    const finalResult = await Listing.aggregate(finalPipeline);
    console.log(`Final result: ${finalResult.length} listings`);
    finalResult.forEach((listing, i) => {
      console.log(`  ${i+1}. ID: ${JSON.stringify(listing.listing_id)} | Title: ${listing.title?.substring(0, 50)}...`);
    });

    // Check if results are different
    if (debugResult.length !== finalResult.length) {
      console.log(`\n❌ ERROR: Debug result has ${debugResult.length} listings but final result has ${finalResult.length} listings!`);
    } else if (debugResult.length === 0) {
      console.log(`\n❌ ERROR: No listings found with images! The $match filter is working but no data matches.`);
      
      // Let's check what happens without the hasImages filter
      console.log('\n🔍 Testing WITHOUT hasImages filter:');
      const noFilterPipeline = [
        { $match: matchFilter },
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
        { $limit: 3 },
        {
          $project: {
            listing_id: 1,
            title: 1,
            imageCount: 1,
            hasImages: 1
          }
        }
      ];
      
      const noFilterResult = await Listing.aggregate(noFilterPipeline);
      console.log(`Without filter: ${noFilterResult.length} listings`);
      noFilterResult.forEach((listing, i) => {
        console.log(`  ${i+1}. ID: ${JSON.stringify(listing.listing_id)} | Images: ${listing.imageCount} | hasImages: ${listing.hasImages} | Title: ${listing.title?.substring(0, 50)}...`);
      });
    } else {
      console.log(`\n✅ Pipeline is working correctly!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

if (require.main === module) {
  testRealAggregation();
}

module.exports = testRealAggregation;