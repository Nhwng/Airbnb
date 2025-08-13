require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const testNewAPIResponse = async () => {
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

    console.log('=== Testing New API Response ===');
    
    // Test the specific listing IDs from the new API response
    const complexIds = [
      { low: 1898994251, high: 161393976, unsigned: false },
      { low: -1503866167, high: 291304170, unsigned: false },
      { low: -1584262311, high: 287073362, unsigned: false },
      { low: 576199455, high: 306816854, unsigned: false },
      { low: 867614523, high: 330529181, unsigned: false }
    ];

    // Helper function to convert complex format to actual number
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

    for (let i = 0; i < complexIds.length; i++) {
      const complexId = complexIds[i];
      const actualId = extractListingId(complexId);
      
      console.log(`\n${i+1}. Complex ID: ${JSON.stringify(complexId)}`);
      console.log(`   Extracted ID: ${actualId}`);
      
      // Check if listing exists
      const listing = await Listing.findOne({ listing_id: actualId });
      if (!listing) {
        console.log(`   ❌ Listing not found`);
        continue;
      }
      
      console.log(`   📋 Listing: ${listing.title?.substring(0, 50)}...`);
      
      // Check images for this listing
      const images = await Image.find({ listing_id: actualId });
      console.log(`   🖼️  Images: ${images.length}`);
      
      if (images.length === 0) {
        console.log(`   ❌ NO IMAGES - Filter failed!`);
      } else {
        console.log(`   ✅ Has images - Filter working!`);
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
  testNewAPIResponse();
}

module.exports = testNewAPIResponse;