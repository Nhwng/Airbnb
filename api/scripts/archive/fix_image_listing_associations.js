require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const fixImageListingAssociations = async () => {
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

    console.log('=== Fixing Image-Listing Associations ===');
    
    // Get all unique image listing_ids
    const imageListingIds = await Image.distinct('listing_id');
    console.log(`Found ${imageListingIds.length} unique listing_ids in images`);
    
    // Get all listing_ids from listings
    const listingIds = await Listing.distinct('listing_id');
    console.log(`Found ${listingIds.length} unique listing_ids in listings`);
    
    // Find mismatches and attempt to fix them
    let fixedCount = 0;
    let orphanedImages = 0;
    
    console.log('\\nAnalyzing associations:');
    
    for (const imageListingId of imageListingIds) {
      // Check if this image listing_id exists in listings
      const matchingListing = await Listing.findOne({ listing_id: imageListingId });
      
      if (!matchingListing) {
        console.log(`Orphaned images for listing_id: ${imageListingId}`);
        
        // Try to find a similar listing_id (within a small range)
        const similarListings = await Listing.find({
          listing_id: {
            $gte: imageListingId - 1000,
            $lte: imageListingId + 1000
          }
        }).limit(5);
        
        if (similarListings.length > 0) {
          console.log(`  Found ${similarListings.length} similar listings:`);
          for (const similar of similarListings) {
            console.log(`    - ${similar.listing_id}: ${similar.title?.substring(0, 40)}...`);
          }
          
          // Use the closest one
          const closest = similarListings.reduce((prev, curr) => {
            return Math.abs(curr.listing_id - imageListingId) < Math.abs(prev.listing_id - imageListingId) ? curr : prev;
          });
          
          console.log(`  Using closest match: ${closest.listing_id}`);
          
          // Update images to use the correct listing_id
          const updateResult = await Image.updateMany(
            { listing_id: imageListingId },
            { $set: { listing_id: closest.listing_id } }
          );
          
          console.log(`  Updated ${updateResult.modifiedCount} images`);
          fixedCount += updateResult.modifiedCount;
        } else {
          // Delete orphaned images
          const deleteResult = await Image.deleteMany({ listing_id: imageListingId });
          console.log(`  Deleted ${deleteResult.deletedCount} orphaned images`);
          orphanedImages += deleteResult.deletedCount;
        }
      } else {
        console.log(`✓ Valid association: ${imageListingId} -> ${matchingListing.title?.substring(0, 40)}...`);
      }
    }
    
    console.log('\\n=== Summary ===');
    console.log(`Images fixed: ${fixedCount}`);
    console.log(`Orphaned images deleted: ${orphanedImages}`);
    
    // Final verification
    const finalCheck = await Listing.aggregate([
      {
        $lookup: {
          from: 'images',
          localField: 'listing_id',
          foreignField: 'listing_id',
          as: 'images'
        }
      },
      {
        $match: { 'images.0': { $exists: true } }
      },
      { $count: 'listingsWithImages' }
    ]);
    
    console.log(`\\nFinal verification: ${finalCheck[0]?.listingsWithImages || 0} listings have images`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (process.argv.includes('--close')) {
      mongoose.connection.close();
    }
  }
};

if (require.main === module) {
  fixImageListingAssociations();
}

module.exports = fixImageListingAssociations;