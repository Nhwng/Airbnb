require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Listing = require('../models/Listing');

// Expanded set of high-quality Unsplash images for Airbnb-style accommodations
const accommodationImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop', // Modern bedroom
  'https://images.unsplash.com/photo-1560448075-bb485b067938?w=400&h=300&fit=crop', // Cozy living room
  'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=400&h=300&fit=crop', // Kitchen
  'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=400&h=300&fit=crop', // Bathroom
  'https://images.unsplash.com/photo-1560449752-8e4d15b3c6f4?w=400&h=300&fit=crop', // Apartment exterior
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop', // Hotel room
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop', // Modern apartment
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop', // Loft space
  'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&h=300&fit=crop', // Bedroom with view
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', // Studio apartment
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop', // House exterior
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', // Balcony view
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop', // Kitchen island
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop', // Living room sofa
  'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=400&h=300&fit=crop', // Modern bathroom
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', // Bedroom minimal
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop', // Workspace area
  'https://images.unsplash.com/photo-1633505646840-15dcc3da2e84?w=400&h=300&fit=crop', // Dining area
  'https://images.unsplash.com/photo-1515263487990-61b07816b924?w=400&h=300&fit=crop', // Villa exterior
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop', // Pool area
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop', // Hotel lobby
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop', // Rooftop terrace
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop', // Garden view
  'https://images.unsplash.com/photo-1540518614846-7eded47ee3be?w=400&h=300&fit=crop', // Cityscape view
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop', // Entrance hall
];

const fixMissingImages = async () => {
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      const DB_URL = process.env.DB_URL;
      console.log('Connecting to DB for image fixing...');
      mongoose.set('strictQuery', false);
      await mongoose.connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    console.log('Analyzing image coverage...');
    
    // Get all listings
    const allListings = await Listing.find({}).limit(200); // Process more listings
    console.log(`Found ${allListings.length} listings to check`);

    let listingsWithImages = 0;
    let listingsWithoutImages = 0;
    let totalImagesAdded = 0;

    for (const listing of allListings) {
      // Check if listing has any images
      const existingImages = await Image.find({ listing_id: listing.listing_id });
      
      if (existingImages.length > 0) {
        listingsWithImages++;
        continue;
      }

      // Add 1-3 random images for listings without images
      listingsWithoutImages++;
      const numImagesToAdd = Math.floor(Math.random() * 3) + 1; // 1 to 3 images
      
      console.log(`Adding ${numImagesToAdd} images to listing ${listing.listing_id}...`);
      
      for (let i = 0; i < numImagesToAdd; i++) {
        const randomImageIndex = Math.floor(Math.random() * accommodationImages.length);
        const imageUrl = accommodationImages[randomImageIndex];
        
        try {
          const image = new Image({
            listing_id: listing.listing_id,
            url: imageUrl,
            caption: `Beautiful ${listing.room_type.toLowerCase()} - ${i + 1}`
          });
          
          await image.save();
          totalImagesAdded++;
        } catch (error) {
          if (error.code === 11000) {
            console.log(`Image already exists for listing ${listing.listing_id}`);
          } else {
            console.error(`Error adding image for listing ${listing.listing_id}:`, error.message);
          }
        }
      }
    }
    
    console.log('\\n=== Image Coverage Analysis ===');
    console.log(`Listings with images: ${listingsWithImages}`);
    console.log(`Listings without images (fixed): ${listingsWithoutImages}`);
    console.log(`Total images added: ${totalImagesAdded}`);
    
    // Final count
    const totalImagesAfter = await Image.countDocuments();
    console.log(`Total images in database after fix: ${totalImagesAfter}`);
    
  } catch (error) {
    console.error('Error fixing missing images:', error);
  } finally {
    if (process.argv.includes('--close')) {
      mongoose.connection.close();
    }
  }
};

// Run if called directly
if (require.main === module) {
  fixMissingImages();
}

module.exports = fixMissingImages;