require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const debugAggregationPipeline = async () => {
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

    console.log('=== Debug Aggregation Pipeline ===');
    
    // Check collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Test the exact pipeline used in the controller
    console.log('\\nTesting aggregation pipeline...');
    
    const pipeline = [
      { $match: {} }, // No filter for testing
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
      },
      // Filter only listings with images
      {
        $match: { hasImages: true }
      },
      // Sort by image count
      {
        $sort: {
          hasImages: -1,
          imageCount: -1,
          created_at: -1
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

    const result = await Listing.aggregate(pipeline);
    
    console.log(`\\nAggregation result: ${result.length} listings with images`);
    result.forEach((listing, i) => {
      console.log(`  ${i+1}. ID: ${listing.listing_id} | Images: ${listing.imageCount} | Has: ${listing.hasImages} | Title: ${listing.title?.substring(0, 50)}...`);
    });
    
    // Test the $sample operation specifically
    console.log('\\nTesting $sample operation...');
    const samplePipeline = [
      { $match: {} },
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
        $match: { hasImages: true }
      },
      { $sample: { size: 3 } }, // This is what the controller uses for featured
      {
        $project: {
          listing_id: 1,
          title: 1,
          imageCount: 1,
          hasImages: 1
        }
      }
    ];
    
    const sampleResult = await Listing.aggregate(samplePipeline);
    console.log(`\\n$sample result: ${sampleResult.length} listings`);
    sampleResult.forEach((listing, i) => {
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
  debugAggregationPipeline();
}

module.exports = debugAggregationPipeline;