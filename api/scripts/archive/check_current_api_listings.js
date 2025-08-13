require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');

const checkCurrentAPIListings = async () => {
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

    console.log('=== Checking Current API Response Listings ===');
    
    // These are the complex IDs from the current API response
    const complexIds = [
      { low: 2146876668, high: 340095198, unsigned: false }, // "Zen Tranquil Studio"
      { low: 707676292, high: 297602393, unsigned: false },   // "500m to Ben Thanh Market"
      { low: 325922017, high: 332198274, unsigned: false },   // "Warm Studio 602B"
      { low: -731098895, high: 179929608, unsigned: false },  // "Stylish, High-Quality Studio"
      { low: -720425898, high: 167177425, unsigned: false }   // "P\"m\"P.11 : Charming Industrial Loft"
    ];

    // Helper function to convert complex format to actual number
    const extractListingId = (listing_id) => {
      if (typeof listing_id === 'object' && listing_id !== null) {
        if (listing_id.low !== undefined && listing_id.high !== undefined) {
          // MongoDB Int64 format - handle negative numbers correctly
          if (listing_id.unsigned === false && listing_id.high < 0) {
            // Handle negative high values
            return listing_id.low + (listing_id.high * Math.pow(2, 32));
          } else {
            // Handle positive values or unsigned
            return (listing_id.low >>> 0) + (listing_id.high * Math.pow(2, 32));
          }
        }
      }
      return listing_id;
    };

    let listingsWithImages = 0;
    let listingsWithoutImages = 0;

    for (let i = 0; i < complexIds.length; i++) {
      const complexId = complexIds[i];
      const actualId = extractListingId(complexId);
      
      console.log(`\n${i+1}. Complex ID: ${JSON.stringify(complexId)}`);
      console.log(`   Extracted ID: ${actualId}`);
      
      // Check images for this listing
      const images = await Image.find({ listing_id: actualId });
      console.log(`   🖼️  Images: ${images.length}`);
      
      if (images.length === 0) {
        console.log(`   ❌ NO IMAGES - This should NOT appear with withImages=true!`);
        listingsWithoutImages++;
      } else {
        console.log(`   ✅ Has images - Correctly filtered`);
        listingsWithImages++;
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Listings WITH images: ${listingsWithImages}`);
    console.log(`   ❌ Listings WITHOUT images: ${listingsWithoutImages}`);
    
    if (listingsWithoutImages > 0) {
      console.log(`\n🚨 PROBLEM: ${listingsWithoutImages} listings without images are being returned by API with withImages=true!`);
      console.log(`🔍 This means the backend aggregation pipeline is NOT working correctly.`);
    } else {
      console.log(`\n✅ SUCCESS: All returned listings have images - backend filtering is working!`);
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
  checkCurrentAPIListings();
}

module.exports = checkCurrentAPIListings;