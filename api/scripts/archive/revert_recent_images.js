require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

const revertRecentImages = async () => {
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

    console.log('=== Reverting Recent Image Additions ===');
    
    // Get all unique listing_ids from actual listings
    const validListingIds = await Listing.distinct('listing_id');
    console.log(`Found ${validListingIds.length} valid listings in database`);
    
    // Get all unique listing_ids from images
    const imageListingIds = await Image.distinct('listing_id');
    console.log(`Found ${imageListingIds.length} unique listing_ids in images`);
    
    // Find orphaned images (images with listing_ids that don't exist in listings)
    const orphanedImageIds = [];
    const validImageIds = [];
    
    for (const imageListingId of imageListingIds) {
      if (!validListingIds.includes(imageListingId)) {
        orphanedImageIds.push(imageListingId);
      } else {
        validImageIds.push(imageListingId);
      }
    }
    
    console.log(`\\nOrphaned image listing_ids: ${orphanedImageIds.length}`);
    console.log(`Valid image listing_ids: ${validImageIds.length}`);
    
    // Remove all images with invalid listing_ids
    if (orphanedImageIds.length > 0) {
      console.log('\\nRemoving orphaned images...');
      const deleteResult = await Image.deleteMany({
        listing_id: { $in: orphanedImageIds }
      });
      console.log(`Deleted ${deleteResult.deletedCount} orphaned images`);
    }
    
    // Remove images that were added by our scripts (Unsplash URLs)
    console.log('\\nRemoving recently added Unsplash images...');
    const unsplashDeleteResult = await Image.deleteMany({
      url: { $regex: 'images\\.unsplash\\.com', $options: 'i' }
    });
    console.log(`Deleted ${unsplashDeleteResult.deletedCount} Unsplash images`);
    
    // Also remove images with generic captions that we added
    const genericCaptionResult = await Image.deleteMany({
      caption: { $regex: 'Beautiful.*\\d+$', $options: 'i' }
    });
    console.log(`Deleted ${genericCaptionResult.deletedCount} images with generic captions`);
    
    // Final verification - check what's left
    const remainingImages = await Image.countDocuments();
    console.log(`\\nRemaining images in database: ${remainingImages}`);
    
    // Sample check - verify some listings still have valid images
    const listingsWithImages = await Listing.aggregate([
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
      { $limit: 5 },
      {
        $project: {
          listing_id: 1,
          title: 1,
          imageCount: { $size: '$images' }
        }
      }
    ]);
    
    console.log('\\nSample listings that still have valid images:');
    listingsWithImages.forEach((listing, i) => {
      console.log(`  ${i+1}. ID: ${listing.listing_id} | Images: ${listing.imageCount} | Title: ${listing.title?.substring(0, 50)}...`);
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
  revertRecentImages();
}

module.exports = revertRecentImages;