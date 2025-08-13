require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

// Sample image URLs (using placeholder images)
const sampleImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
  'https://images.unsplash.com/photo-1560448075-bb485b067938?w=400',
  'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=400',
  'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=400',
  'https://images.unsplash.com/photo-1560449752-8e4d15b3c6f4?w=400',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
  'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'
];

const addSampleImages = async () => {
  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      const DB_URL = process.env.DB_URL;
      console.log('Connecting to DB:', DB_URL);
      mongoose.set('strictQuery', false);
      await mongoose.connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Get first 10 listings
    const listings = await Listing.find().limit(10);
    
    if (listings.length === 0) {
      console.log('No listings found in database');
      return;
    }

    console.log(`Found ${listings.length} listings, adding sample images...`);

    // Add 1-3 images per listing
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const numImages = Math.floor(Math.random() * 3) + 1; // 1 to 3 images
      
      for (let j = 0; j < numImages; j++) {
        const imageUrl = sampleImages[(i * 3 + j) % sampleImages.length];
        
        try {
          const image = new Image({
            listing_id: listing.listing_id,
            url: imageUrl,
            caption: `Beautiful accommodation ${j + 1}`
          });
          
          await image.save();
          console.log(`Added image for listing ${listing.listing_id}: ${imageUrl}`);
        } catch (error) {
          if (error.code === 11000) {
            console.log(`Image already exists for listing ${listing.listing_id}`);
          } else {
            console.error(`Error adding image for listing ${listing.listing_id}:`, error.message);
          }
        }
      }
    }
    
    console.log('Finished adding sample images');
    
    // Check total images count
    const totalImages = await Image.countDocuments();
    console.log(`Total images in database: ${totalImages}`);
    
  } catch (error) {
    console.error('Error adding sample images:', error);
  } finally {
    // Don't close connection if it was already open
    if (process.argv.includes('--close')) {
      mongoose.connection.close();
    }
  }
};

// Run if called directly
if (require.main === module) {
  addSampleImages();
}

module.exports = addSampleImages;