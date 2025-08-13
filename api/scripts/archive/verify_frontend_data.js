require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');

const verifyFrontendData = async () => {
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

    console.log('=== Verifying Frontend Data ===');
    
    // Get the same API response that the frontend gets
    const http = require('http');
    
    const getAPIData = () => {
      return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:4000/listings?limit=8&featured=true&withImages=true', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
      });
    };

    const apiData = await getAPIData();
    console.log(`API returned ${apiData.length} listings`);

    // Helper function to extract listing ID
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

    // Check each listing that the frontend receives
    for (let i = 0; i < Math.min(5, apiData.length); i++) {
      const listing = apiData[i];
      const actualId = extractListingId(listing.listing_id);
      
      console.log(`\n${i+1}. "${listing.title?.substring(0, 50)}..."`);
      console.log(`   Complex ID: ${JSON.stringify(listing.listing_id)}`);
      console.log(`   Extracted ID: ${actualId}`);
      
      // Check if this listing actually has images
      const images = await Image.find({ listing_id: actualId });
      console.log(`   Images in DB: ${images.length}`);
      
      if (images.length === 0) {
        console.log(`   ❌ PROBLEM: Frontend receives this listing but it has NO images!`);
        console.log(`   🔍 This means the backend filtering is NOT working correctly`);
      } else {
        console.log(`   ✅ Correct: Listing has ${images.length} images`);
        
        // Test the /images API endpoint for this listing
        const imageEndpoint = () => {
          return new Promise((resolve, reject) => {
            const req = http.get(`http://localhost:4000/images/${actualId}`, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                try {
                  const imageData = JSON.parse(data);
                  resolve(imageData);
                } catch (e) {
                  reject(e);
                }
              });
            });
            req.on('error', reject);
            req.setTimeout(5000, () => reject(new Error('Timeout')));
          });
        };

        try {
          const imageApiData = await imageEndpoint();
          console.log(`   📸 /images API returns: ${Array.isArray(imageApiData) ? imageApiData.length : 'not array'} images`);
        } catch (error) {
          console.log(`   ❌ /images API error: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

if (require.main === module) {
  verifyFrontendData();
}

module.exports = verifyFrontendData;