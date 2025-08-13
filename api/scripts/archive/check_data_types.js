require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const checkDataTypes = async () => {
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

    console.log('=== Checking Data Types ===');
    
    // Sample some listings
    console.log('\n📋 Sample Listings:');
    const sampleListings = await Listing.find({}).limit(5);
    sampleListings.forEach((listing, i) => {
      console.log(`${i+1}. listing_id: ${listing.listing_id} (type: ${typeof listing.listing_id})`);
      if (typeof listing.listing_id === 'object') {
        console.log(`   Object structure:`, listing.listing_id);
      }
    });
    
    // Sample some images
    console.log('\n🖼️  Sample Images:');
    const sampleImages = await Image.find({}).limit(5);
    sampleImages.forEach((image, i) => {
      console.log(`${i+1}. listing_id: ${image.listing_id} (type: ${typeof image.listing_id})`);
      if (typeof image.listing_id === 'object') {
        console.log(`   Object structure:`, image.listing_id);
      }
    });
    
    // Check if there are any images at all
    const totalImages = await Image.countDocuments();
    const totalListings = await Listing.countDocuments();
    console.log(`\n📊 Totals: ${totalListings} listings, ${totalImages} images`);
    
    // Check unique listing_ids in both collections
    const listingIds = await Listing.distinct('listing_id');
    const imageListingIds = await Image.distinct('listing_id');
    
    console.log(`\n🔍 Unique listing_ids: ${listingIds.length} in listings, ${imageListingIds.length} in images`);
    
    // Find common listing_ids
    const commonIds = listingIds.filter(id => {
      return imageListingIds.some(imgId => {
        // Handle both simple numbers and complex objects
        const listingIdStr = JSON.stringify(id);
        const imgIdStr = JSON.stringify(imgId);
        return listingIdStr === imgIdStr;
      });
    });
    
    console.log(`\n✅ Common listing_ids: ${commonIds.length}`);
    
    if (commonIds.length > 0) {
      console.log('First few common IDs:');
      commonIds.slice(0, 3).forEach((id, i) => {
        console.log(`  ${i+1}. ${JSON.stringify(id)}`);
      });
    }
    
    // Test a manual lookup for one listing
    if (sampleListings.length > 0) {
      const testListing = sampleListings[0];
      console.log(`\n🧪 Manual lookup test for listing_id: ${testListing.listing_id}`);
      
      const matchingImages = await Image.find({ listing_id: testListing.listing_id });
      console.log(`Found ${matchingImages.length} images with exact match`);
      
      // Also try string comparison
      const matchingImagesStr = await Image.find({ 
        listing_id: testListing.listing_id.toString() 
      });
      console.log(`Found ${matchingImagesStr.length} images with string match`);
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
  checkDataTypes();
}

module.exports = checkDataTypes;