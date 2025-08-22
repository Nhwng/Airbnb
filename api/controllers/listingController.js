const Listing = require('../models/Listing');
const Image = require('../models/Image');
const axios = require('axios'); // Thêm axios
const { exec } = require('child_process');
const City = require('../models/City');
const HomeType = require('../models/HomeType');
const path = require('path');
const mongoose = require('mongoose');

// Helper function to handle Vietnamese city name variations
const getCityVariations = (cityName) => {
  const cityMappings = {
    'Ho Chi Minh': '(Ho Chi Minh|HCM|Saigon|Sài Gòn|HCMC)',
    'Ha Noi': '(Ha Noi|Hanoi|Hà Nội)',
    'Da Nang': '(Da Nang|Danang|Đà Nẵng)',
    'Hue': '(Hue|Huế)',
    'Can Tho': '(Can Tho|Cần Thơ)',
    'Nha Trang': '(Nha Trang)',
    'Vung Tau': '(Vung Tau|Vũng Tàu)',
    'Phu Quoc': '(Phu Quoc|Phú Quốc)'
  };

  // Check if the input matches any key or variation
  for (const [key, variations] of Object.entries(cityMappings)) {
    if (cityName.toLowerCase().includes(key.toLowerCase()) || 
        variations.toLowerCase().includes(cityName.toLowerCase())) {
      return variations;
    }
  }
  
  // If no mapping found, return the original city name
  return cityName;
};

// Adds a listing in the DB
exports.addListing = async (req, res) => {
  try {
    const userData = req.user;
    const {
      title,
      description,
      nightly_price,
      person_capacity,
      room_type,
      city,
      address,
      photos
    } = req.body;

    const listingData = {
      host_id: Number(userData.user_id),
      listing_id: Math.floor(100000 + Math.random() * 900000),
      title,
      description,
      currency: 'VND',
      nightly_price: Number(nightly_price),
      person_capacity: Number(person_capacity),
      room_type,
      city,
      address
    };
    const listing = await Listing.create(listingData);

    // lưu ảnh phòng vào collection images
    if (Array.isArray(photos) && photos.length > 0) {
      const imageDocs = photos.map((url, idx) => ({
        listing_id: listing.listing_id,
        url,
        caption: `Room image ${idx + 1}`
      }));
      await Image.insertMany(imageDocs);
    }

    res.status(200).json({
      listing,
    });
  } catch (err) {
    console.error('addListing error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Returns user-specific listings
exports.userListings = async (req, res) => {
  try {
    const userData = req.user;
    const listings = await Listing.find({ host_id: userData.user_id });
    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};


// Returns all listings in DB with pagination and filtering, prioritizing those with images
exports.getListings = async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      featured = false,
      city,
      minPrice,
      maxPrice,
      guests,
      roomType,
      withImages = 'true' // New parameter to filter only listings with images
    } = req.query;

    // Build match filter object
    let matchFilter = {};
    
    if (city && city !== '') {
      // Handle Vietnamese city name variations
      const cityVariations = getCityVariations(city);
      matchFilter.city = { $regex: cityVariations, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      matchFilter.nightly_price = {};
      if (minPrice) matchFilter.nightly_price.$gte = Number(minPrice);
      if (maxPrice) matchFilter.nightly_price.$lte = Number(maxPrice);
    }
    
    if (guests && guests !== '') {
      matchFilter.person_capacity = { $gte: Number(guests) };
    }
    
    if (roomType && roomType !== '') {
      const roomTypes = roomType.split(',').filter(Boolean);
      if (roomTypes.length > 0) {
        matchFilter.room_type = { $in: roomTypes };
      }
    }

    // Simplified approach: Use direct queries instead of aggregation to avoid data type issues
    console.log('🔧 Using direct query approach instead of aggregation...');
    
    // Get listings with basic filtering
    let query = Listing.find(matchFilter);
    
    // Handle pagination - increase query size to find more valid listings
    const queryMultiplier = 10; // Query 10x more to account for filtering
    if (featured === 'true') {
      query = query.limit(Number(limit) * queryMultiplier);
    } else {
      query = query.skip(Number(offset)).limit(Number(limit) * queryMultiplier);
    }
    
    // Sort by creation date for now
    query = query.sort({ created_at: -1 });
    
    const listings = await query.exec();
    
    // Add firstImage field to each listing by querying images separately
    const listingsWithImages = await Promise.all(
      listings.map(async (listing) => {
        try {
          // Get first image for this listing
          const Image = require('../models/Image');
          const firstImage = await Image.findOne({ listing_id: listing.listing_id });
          
          // Convert to object and ensure listing_id is preserved as-is
          const listingObj = listing.toObject();
          
          // Store the original listing_id exactly as stored in database
          const originalId = listing.listing_id;
          
          return {
            ...listingObj,
            listing_id: originalId, // Preserve exact database value
            firstImage: firstImage || null
          };
        } catch (error) {
          console.warn(`Error loading image for listing ${listing.listing_id}:`, error.message);
          const listingObj = listing.toObject();
          return {
            ...listingObj,
            listing_id: listing.listing_id, // Preserve exact database value
            firstImage: null
          };
        }
      })
    );

    // Filter listings based on image requirement only
    console.log('🔧 Filtering listings based on image requirements...');
    let validListings = listingsWithImages;
    
    // Apply image filtering if required
    if (withImages === 'true') {
      validListings = listingsWithImages.filter(listing => {
        const hasImage = listing.firstImage && listing.firstImage.url;
        if (!hasImage) {
          console.log(`❌ Excluding listing ${listing.listing_id}: ${listing.title?.substring(0, 40)} (no images)`);
          return false;
        }
        console.log(`✅ Including listing ${listing.listing_id}: ${listing.title?.substring(0, 40)}`);
        return true;
      });
    }
    
    // Limit results
    validListings = validListings.slice(0, Number(limit));
    
    console.log(`📊 Filtered ${listingsWithImages.length} -> ${validListings.length} valid listings (target: ${limit})`);

    res.status(200).json(validListings);
  } catch (err) {
    console.error('Error in getListings:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Returns single listing based on listing_id
exports.singleListing = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔥 GET /listings/${id}`);
    
    // Handle large numbers that exceed JavaScript's safe integer limit
    let numericId;
    try {
      numericId = Number(id);
      // Check if the number conversion lost precision for very large numbers
      if (id.length > 15 && !Number.isSafeInteger(numericId)) {
        numericId = parseFloat(id);
      }
    } catch (error) {
      console.log(`❌ Number conversion error for ${id}:`, error.message);
      return res.status(400).json({
        message: 'Invalid listing ID format',
      });
    }
    
    // Check if conversion resulted in valid number
    if (isNaN(numericId)) {
      console.log(`❌ NaN result for ${id}, numericId:`, numericId);
      return res.status(400).json({
        message: 'Invalid listing ID format',
      });
    }
    
    console.log(`🔍 Looking for listing with ID: ${numericId} (original: ${id})`);
    
    // Try different approaches to find the listing due to number precision issues
    let listing = null;
    
    // First try: Direct number match
    listing = await Listing.findOne({ listing_id: numericId });
    console.log(`📄 Direct number match:`, !!listing);
    
    // Second try: String-based aggregation query (handles Int64 format)
    if (!listing) {
      console.log(`🔄 Trying aggregation approach for large number...`);
      const aggregationResult = await Listing.aggregate([
        {
          $addFields: {
            listing_id_str: {
              $cond: {
                if: { $type: "$listing_id" },
                then: { $toString: "$listing_id" },
                else: "$listing_id"
              }
            }
          }
        },
        {
          $match: {
            $or: [
              { listing_id: numericId },
              { listing_id_str: id },
              { listing_id_str: numericId.toString() }
            ]
          }
        },
        { $limit: 1 }
      ]);
      
      if (aggregationResult.length > 0) {
        listing = aggregationResult[0];
        console.log(`✅ Found via aggregation: ${listing.title}`);
      }
    }
    
    if (listing) {
      console.log(`✅ Listing found: ${listing.title}`);
    } else {
      console.log(`❌ No listing found with ID ${numericId} after trying all methods`);
    }
    
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    // Add firstImage field like in other functions
    try {
      const firstImage = await Image.findOne({ listing_id: listing.listing_id });
      const listingObj = listing.toObject ? listing.toObject() : listing;
      
      const listingWithImage = {
        ...listingObj,
        listing_id: listing.listing_id, // Preserve exact database value
        firstImage: firstImage || null
      };
      
      res.status(200).json(listingWithImage);
    } catch (imageError) {
      console.warn(`Error loading image for single listing ${listing.listing_id}:`, imageError.message);
      const listingObj = listing.toObject ? listing.toObject() : listing;
      res.status(200).json({
        ...listingObj,
        listing_id: listing.listing_id,
        firstImage: null
      });
    }
  } catch (err) {
    console.error('Single listing error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Search listings in the DB with image prioritization
exports.searchListings = async (req, res) => {
  try {
    const { key } = req.params;
    const {
      q, // New general query parameter
      city,
      minPrice,
      maxPrice,
      guests,
      roomType,
      limit = 50,
      offset = 0,
      withImages = 'false'
    } = req.query;

    console.log('🔍 Search parameters:', { city, guests, withImages, minPrice, maxPrice, limit, offset });

    // Build match filter object
    let matchFilter = {};

    // Handle both old 'key' param and new 'q' query param
    const searchQuery = key || q;

    // Text search - more comprehensive
    if (searchQuery && searchQuery !== '') {
      matchFilter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } },
        { room_type: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // City filters
    if (city && city !== '') {
      const cities = city.split(',').filter(Boolean);
      if (cities.length > 0) {
        // Handle Vietnamese city name variations for each city
        const cityPatterns = cities.map(cityName => getCityVariations(cityName.trim()));
        const cityFilter = { $regex: cityPatterns.join('|'), $options: 'i' };
        
        console.log('🌍 City filter pattern:', cityFilter);
        
        // Combine with existing search if present
        if (matchFilter.$or) {
          matchFilter.$and = [{ $or: matchFilter.$or }, { city: cityFilter }];
          delete matchFilter.$or;
        } else {
          matchFilter.city = cityFilter;
        }
      }
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      matchFilter.nightly_price = {};
      if (minPrice) matchFilter.nightly_price.$gte = Number(minPrice);
      if (maxPrice) matchFilter.nightly_price.$lte = Number(maxPrice);
    }
    
    // Guest capacity filter
    if (guests && guests !== '') {
      matchFilter.person_capacity = { $gte: Number(guests) };
    }
    
    // Room type filter
    if (roomType && roomType !== '') {
      const roomTypes = roomType.split(',').filter(Boolean);
      if (roomTypes.length > 0) {
        matchFilter.room_type = { $in: roomTypes };
      }
    }

    console.log('🔍 Final match filter:', JSON.stringify(matchFilter, null, 2));

    // Use direct query approach instead of aggregation to avoid precision issues
    console.log('🔧 Using direct query approach for search...');
    
    let searchMatches = await Listing.find(matchFilter)
      .sort({ nightly_price: 1 })
      .skip(Number(offset))
      .limit(Number(limit) * 20); // Get many more results initially for filtering

    console.log(`🔍 Raw search results: ${searchMatches.length} matches`);

    // Use same approach as homepage: add images to all listings first, then filter
    console.log('🔧 Adding images to all search results first...');
    
    // Add firstImage field to each listing by querying images separately  
    const listingsWithImages = await Promise.all(
      searchMatches.map(async (listing) => {
        try {
          // Get first image for this listing
          const firstImage = await Image.findOne({ listing_id: listing.listing_id });
          
          // Convert to object and ensure listing_id is preserved as-is
          const listingObj = listing.toObject();
          
          // Store the original listing_id exactly as stored in database
          const originalId = listing.listing_id;
          
          return {
            ...listingObj,
            listing_id: originalId, // Preserve exact database value
            firstImage: firstImage || null
          };
        } catch (error) {
          console.warn(`Error loading image for listing ${listing.listing_id}:`, error.message);
          const listingObj = listing.toObject();
          return {
            ...listingObj,
            listing_id: listing.listing_id, // Preserve exact database value
            firstImage: null
          };
        }
      })
    );

    // Filter listings based on queryability and image requirements
    console.log('🔧 Filtering search results based on queryability and images...');
    let validListings = [];
    
    for (const listing of listingsWithImages) {
      try {
        let shouldExclude = false;
        
        // Check if listing can be queried directly (ensure queryability)
        const testListing = await Listing.findOne({ listing_id: listing.listing_id });
        if (!testListing) {
          console.log(`❌ Excluding search result ${listing.listing_id}: ${listing.title?.substring(0, 40)} (not queryable)`);
          shouldExclude = true;
        }
        
        // Only exclude if no images AND withImages is required
        if (!shouldExclude && withImages === 'true' && !listing.firstImage?.url) {
          console.log(`❌ Excluding search result ${listing.listing_id}: ${listing.title?.substring(0, 40)} (no images)`);
          shouldExclude = true;
        }
        
        if (!shouldExclude) {
          console.log(`✅ Including search result ${listing.listing_id}: ${listing.title?.substring(0, 40)}`);
          validListings.push(listing);
          
          // Stop when we have enough results
          if (validListings.length >= Number(limit)) {
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Validation error for listing ${listing.listing_id}: ${error.message}`);
        continue;
      }
    }
    
    const originalCount = searchMatches.length;
    searchMatches = validListings;
    console.log(`📊 Search validation filtered ${originalCount} -> ${searchMatches.length} valid listings`);

    // Legacy code (kept for compatibility but should not be needed)
    if (false && withImages === 'true') {
      console.log('🔧 Applying post-aggregation validation filtering...');
      const validatedMatches = [];
      
      for (const listing of searchMatches) {
        try {
          // Check if listing can be queried directly using same logic as getListings
          const testListing = await Listing.findOne({ listing_id: listing.listing_id });
          if (!testListing) {
            console.log(`❌ Excluding search result ${listing.listing_id}: ${listing.title?.substring(0, 40)} (not queryable)`);
            continue;
          }
          
          // Check if listing has images
          if (!listing.firstImage) {
            console.log(`❌ Excluding search result ${listing.listing_id}: ${listing.title?.substring(0, 40)} (no images)`);
            continue;
          }
          
          console.log(`✅ Including search result ${listing.listing_id}: ${listing.title?.substring(0, 40)}`);
          validatedMatches.push(listing);
        } catch (error) {
          console.log(`❌ Validation error for listing ${listing.listing_id}: ${error.message}`);
          continue;
        }
      }
      
      const originalCount = searchMatches.length;
      searchMatches = validatedMatches;
      console.log(`📊 Search validation filtered ${originalCount} -> ${searchMatches.length} valid listings`);
    }

    console.log(`🔍 Search completed: Found ${searchMatches.length} results for filters:`, {
      city,
      guests,
      withImages,
      minPrice,
      maxPrice,
      roomType
    });

    res.status(200).json(searchMatches);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Add or update the syncData function in listingController.js
exports.triggerDataSync = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.body;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const scriptPath = path.join(__dirname, '../scripts/scrape_data.py');
    exec(`python ${scriptPath} ${checkIn} ${checkOut}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Sync error: ${error}`);
        return res.status(500).json({ message: 'Error during data sync', error: error.message });
      }
      console.log(`Sync stdout: ${stdout}`);
      if (stderr) {
        console.error(`Sync stderr: ${stderr}`);
      }
      res.status(200).json({ message: 'Data sync initiated successfully' });
    });
  } catch (err) {
    console.error('Sync data error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};


exports.getCatalog = async (req, res) => {
  try {
    // Lấy tất cả các thành phố
    const cities = await City.find();
    // Lấy tất cả các loại nhà
    const homeTypes = await HomeType.find().populate('subtypes');

    // Trả về dữ liệu dưới dạng JSON
    res.status(200).json({
      cities,
      homeTypes,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error fetching catalog',
      error: err.message,
    });
  }
};


exports.createHomeType = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const homeType = new HomeType({ name, description, image });
    await homeType.save();
    res.status(201).json(homeType);
  } catch (err) {
    res.status(500).json({ message: 'Error creating home type', error: err.message });
  }
};


exports.addSubtype = async (req, res) => {
   try {
     const { id } = req.params;
     const { name, description, image } = req.body;
     // $push sẽ bypass validate existing subdocs
     const updated = await HomeType.findByIdAndUpdate(
       id,
       { $push: { subtypes: { name, description, image } } },
       { new: true }  // trả về doc đã cập nhật
     );
     if (!updated) return res.status(404).json({ message: 'Home type not found' });
     return res.status(200).json(updated);
   } catch (err) {
     console.error(err);
     return res
       .status(500)
       .json({ message: 'Error adding subtype', error: err.message });
   }
};

// Xóa HomeType (Category)
exports.deleteHomeType = async (req, res) => {
  try {
    const { id } = req.params;
    const homeType = await HomeType.findById(id);
    if (!homeType) return res.status(404).json({ message: 'Home type not found' });
    await HomeType.findByIdAndDelete(id);
    res.status(200).json({ message: 'Home type deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting home type', error: err.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const userData = req.user;
    const { id, ...fields } = req.body;
    let listing = null;
    // tìm theo listing_id
    if (!isNaN(Number(id))) {
      listing = await Listing.findOne({ listing_id: Number(id) });
    }
    // tìm theo ObjectId, nếu không thấy
    if (!listing && mongoose.Types.ObjectId.isValid(id)) {
      listing = await Listing.findById(id);
    }
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.host_id !== userData.user_id && userData.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    // Nếu có ảnh mới, thêm vào collection images
    if (Array.isArray(fields.photos) && fields.photos.length > 0) {
      const imageDocs = fields.photos.map((url, idx) => ({
        listing_id: listing.listing_id,
        url,
        caption: `Room image ${idx + 1}`
      }));
      await Image.insertMany(imageDocs);
      delete fields.photos;
    }
    // Cập nhật theo _id
    const updated = await Listing.findByIdAndUpdate(
      listing._id,
      { $set: fields },
      { new: true, runValidators: true }
    );
    return res.status(200).json({ message: 'Listing updated', listing: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating listing', error: err.message });
  }
};

// Xóa listing (dùng ObjectId)
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.user;
    let listing = null;
    // tìm theo listing_id
    if (!isNaN(Number(id))) {
      listing = await Listing.findOne({ listing_id: Number(id) });
    }
    // thử tìm theo ObjectId, nếu không thấy
    if (!listing && mongoose.Types.ObjectId.isValid(id)) {
      listing = await Listing.findById(id);
    }
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.host_id !== userData.user_id && userData.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this listing' });
    }
    await Listing.findByIdAndDelete(listing._id);
    res.status(200).json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('Error deleting listing:', err);
    res.status(500).json({ message: 'Error deleting listing', error: err.message });
  }
};
exports.deleteSubtype = async (req, res) => {
  try {
    const { id, subId } = req.params;    // id = homeTypeId, subId = subtypeId
    const updated = await HomeType.findByIdAndUpdate(
      id,
      { $pull: { subtypes: { _id: subId } } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'HomeType not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error deleting subtype:', err);
    return res.status(500).json({ message: 'Error deleting subtype', error: err.message });
  }
};

// Get listings by home type for homepage sections
exports.getListingsByHomeType = async (req, res) => {
  try {
    const { homeType, limit = 4 } = req.query;
    
    console.log(`🏠 Getting listings for home type: ${homeType}`);
    
    if (!homeType || homeType === '') {
      return res.status(400).json({
        message: 'Home type parameter is required',
      });
    }
    
    // Get a broader search since we need to map home types to actual room types
    // Instead of exact matching, let's get all listings and then filter them
    let query = Listing.find({})
      .sort({ created_at: -1 })
      .limit(Number(limit) * 20); // Get many more to filter
    
    const listings = await query.exec();
    
    // Add firstImage field to each listing
    const listingsWithImages = await Promise.all(
      listings.map(async (listing) => {
        try {
          const firstImage = await Image.findOne({ listing_id: listing.listing_id });
          const listingObj = listing.toObject();
          
          return {
            ...listingObj,
            listing_id: listing.listing_id,
            firstImage: firstImage || null
          };
        } catch (error) {
          console.warn(`Error loading image for listing ${listing.listing_id}:`, error.message);
          const listingObj = listing.toObject();
          return {
            ...listingObj,
            listing_id: listing.listing_id,
            firstImage: null
          };
        }
      })
    );

    // Filter listings with images first, then by home type preference
    let validListings = listingsWithImages
      .filter(listing => listing.firstImage && listing.firstImage.url);
      
    // For now, just return the first few listings since the home type matching isn't working well
    // TODO: Improve home type to room_type mapping
    validListings = validListings.slice(0, Number(limit));
    
    console.log(`🏠 Found ${validListings.length} listings with images for home type: ${homeType}`);
    
    res.status(200).json(validListings);
  } catch (err) {
    console.error('Error getting listings by home type:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Xóa phòng của user host theo listing_id
exports.deleteUserListing = async (req, res) => {
  try {
    const userData = req.user;
    const { listingId } = req.params;
    const listing = await Listing.findOne({ listing_id: Number(listingId) });
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.host_id !== userData.user_id) {
      return res.status(403).json({ message: 'Unauthorized to delete this listing' });
    }
    await Listing.findByIdAndDelete(listing._id);
    // Xóa luôn ảnh liên quan
    await Image.deleteMany({ listing_id: Number(listingId) });
    res.status(200).json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('Error deleting user listing:', err);
    res.status(500).json({ message: 'Error deleting user listing', error: err.message });
  }
};