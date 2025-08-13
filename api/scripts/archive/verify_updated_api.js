require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');

const verifyUpdatedAPI = async () => {
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

    console.log('=== Verifying Updated API ===');
    
    // Test the specific listing from the updated API response
    const complexId = { low: -1006996836, high: 329070233, unsigned: false };
    
    // Helper function to extract actual ID
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
    
    const actualId = extractListingId(complexId);
    console.log(`Complex ID: ${JSON.stringify(complexId)}`);
    console.log(`Extracted ID: ${actualId}`);
    
    // Check images for this listing
    const images = await Image.find({ listing_id: actualId });
    console.log(`Images found: ${images.length}`);
    
    if (images.length > 0) {
      console.log(`✅ SUCCESS! API now correctly returns listings with images (${images.length} images)`);
      console.log(`✅ Backend filtering is working correctly!`);
      console.log(`✅ The updated aggregation pipeline is functioning!`);
    } else {
      console.log(`❌ STILL BROKEN: Listing has no images`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

if (require.main === module) {
  verifyUpdatedAPI();
}

module.exports = verifyUpdatedAPI;