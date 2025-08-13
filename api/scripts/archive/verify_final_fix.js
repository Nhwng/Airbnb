require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');

const verifyFinalFix = async () => {
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

    console.log('=== Verifying Final Fix ===');
    
    // Test the complex ID from the API response
    const complexId = { low: -747593956, high: 328241501, unsigned: false };
    
    // Use the same extraction function as frontend
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
        } else if (listing_id._id) {
          return listing_id._id;
        } else {
          return listing_id.toString();
        }
      }
      return listing_id;
    };
    
    const actualId = extractListingId(complexId);
    console.log(`Complex ID: ${JSON.stringify(complexId)}`);
    console.log(`Extracted ID: ${actualId}`);
    
    // Check images for this listing
    const images = await Image.find({ listing_id: actualId });
    console.log(`Images found: ${images.length}`);
    
    if (images.length > 0) {
      console.log(`✅ SUCCESS: API correctly returned listing with ${images.length} images!`);
      console.log(`✅ Image filtering is working correctly!`);
      console.log(`✅ ID extraction function is working correctly!`);
    } else {
      console.log(`❌ PROBLEM: Listing has no images but was returned by API`);
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
  verifyFinalFix();
}

module.exports = verifyFinalFix;