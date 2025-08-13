require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');
const axiosInstance = require('axios');

// High-quality accommodation images
const featuredImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1560448075-bb485b067938?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=400&h=300&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format',
];

const ensureFeaturedListingsHaveImages = async () => {
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      const DB_URL = process.env.DB_URL;
      console.log('Connecting to DB...');
      mongoose.set('strictQuery', false);
      await mongoose.connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    console.log('Getting featured listings (sample)...');
    
    // Get featured listings using aggregation (similar to API)
    const featuredListings = await Listing.aggregate([
      { $sample: { size: 20 } } // Get 20 random listings for homepage
    ]);

    console.log(`Processing ${featuredListings.length} featured listings...`);

    let imagesAdded = 0;
    let listingsProcessed = 0;

    for (const listing of featuredListings) {
      listingsProcessed++;
      
      // Check if listing has any images
      const existingImages = await Image.find({ listing_id: listing.listing_id });
      
      if (existingImages.length > 0) {
        console.log(`✓ Listing ${listing.listing_id} already has ${existingImages.length} images`);
        continue;
      }

      console.log(`+ Adding images to listing ${listing.listing_id} (${listing.title?.substring(0, 50)}...)`);
      
      // Add 2-3 images for each listing without images
      const numImages = Math.floor(Math.random() * 2) + 2; // 2 to 3 images
      
      for (let i = 0; i < numImages; i++) {
        const imageUrl = featuredImages[Math.floor(Math.random() * featuredImages.length)];
        
        try {
          const image = new Image({
            listing_id: listing.listing_id,
            url: imageUrl,
            caption: `Beautiful ${listing.room_type?.toLowerCase() || 'accommodation'} ${i + 1}`
          });
          
          await image.save();
          imagesAdded++;
        } catch (error) {
          if (error.code !== 11000) { // Ignore duplicate key errors
            console.error(`Error adding image: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\\n=== Featured Listings Image Fix Summary ===');
    console.log(`Listings processed: ${listingsProcessed}`);
    console.log(`Images added: ${imagesAdded}`);
    
    // Verify a few listings
    console.log('\\nVerification - checking some listings:');
    for (let i = 0; i < Math.min(5, featuredListings.length); i++) {
      const listing = featuredListings[i];
      const images = await Image.find({ listing_id: listing.listing_id });
      console.log(`  ${listing.listing_id}: ${images.length} images`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (process.argv.includes('--close')) {
      mongoose.connection.close();
    }
  }
};

// Run if called directly
if (require.main === module) {
  ensureFeaturedListingsHaveImages();
}

module.exports = ensureFeaturedListingsHaveImages;