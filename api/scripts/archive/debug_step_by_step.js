require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const debugStepByStep = async () => {
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

    console.log('=== Step-by-Step Pipeline Debug ===');
    
    // Step 1: Basic match
    console.log('\n1. Basic match (no filter):');
    const step1 = await Listing.aggregate([
      { $match: {} },
      { $limit: 2 },
      { $project: { listing_id: 1, title: 1 } }
    ]);
    step1.forEach((item, i) => {
      console.log(`  ${i+1}. ${JSON.stringify(item.listing_id)} | ${item.title?.substring(0, 40)}...`);
    });
    
    // Step 2: Add lookup
    console.log('\n2. After lookup:');
    const step2 = await Listing.aggregate([
      { $match: {} },
      {
        $lookup: {
          from: 'images',
          localField: 'listing_id',
          foreignField: 'listing_id',
          as: 'images'
        }
      },
      { $limit: 2 },
      { $project: { listing_id: 1, title: 1, imageCount: { $size: '$images' } } }
    ]);
    step2.forEach((item, i) => {
      console.log(`  ${i+1}. ${JSON.stringify(item.listing_id)} | Images: ${item.imageCount} | ${item.title?.substring(0, 40)}...`);
    });
    
    // Step 3: Add hasImages field
    console.log('\n3. After addFields:');
    const step3 = await Listing.aggregate([
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
      { $limit: 3 },
      { $project: { listing_id: 1, title: 1, imageCount: 1, hasImages: 1 } }
    ]);
    step3.forEach((item, i) => {
      console.log(`  ${i+1}. ${JSON.stringify(item.listing_id)} | Images: ${item.imageCount} | hasImages: ${item.hasImages} | ${item.title?.substring(0, 40)}...`);
    });
    
    // Step 4: Filter by hasImages
    console.log('\n4. After filtering by hasImages=true:');
    const step4 = await Listing.aggregate([
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
      { $match: { hasImages: true } },
      { $limit: 3 },
      { $project: { listing_id: 1, title: 1, imageCount: 1, hasImages: 1 } }
    ]);
    console.log(`Found ${step4.length} listings with hasImages=true`);
    step4.forEach((item, i) => {
      console.log(`  ${i+1}. ${JSON.stringify(item.listing_id)} | Images: ${item.imageCount} | hasImages: ${item.hasImages} | ${item.title?.substring(0, 40)}...`);
    });
    
    // Step 5: Final pipeline with sorting and projection
    console.log('\n5. Complete pipeline (as in controller):');
    const step5 = await Listing.aggregate([
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
      { $match: { hasImages: true } },
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
          images: 0,
          imageCount: 0,
          hasImages: 0
        }
      }
    ]);
    console.log(`Final result: ${step5.length} listings`);
    step5.forEach((item, i) => {
      console.log(`  ${i+1}. ${JSON.stringify(item.listing_id)} | ${item.title?.substring(0, 40)}...`);
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
  debugStepByStep();
}

module.exports = debugStepByStep;