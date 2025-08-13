const Listing = require('../models/Listing');
const axios = require('axios'); // Thêm axios
const { exec } = require('child_process');
const City = require('../models/city');
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
      currency,
      nightly_price,
      person_capacity,
      room_type,
      latitude,
      longitude,
      city
    } = req.body;


    const listingData = {
      host_id: Number(userData.user_id),
      listing_id: Math.floor(100000 + Math.random() * 900000),
      title,
      description,
      currency,
      nightly_price: Number(nightly_price),
      person_capacity: Number(person_capacity),
      room_type,
      latitude: Number(latitude),
      longitude: Number(longitude),
      city
    };
    const listing = await Listing.create(listingData);

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

    // CRITICAL FIX: Filter out listings that can't be queried directly
    // This solves the 404 issue by only returning listings that actually exist
    console.log('🔧 Filtering listings to only include queryable ones...');
    const validListings = [];
    const maxValidListings = Number(limit); // Stop when we have enough valid listings
    
    for (const listing of listingsWithImages) {
      if (validListings.length >= maxValidListings) {
        break; // Stop when we have enough valid listings
      }
      
      // Check if listing can be queried directly
      const testListing = await Listing.findOne({ listing_id: listing.listing_id });
      if (!testListing) {
        console.log(`❌ Excluding listing ${listing.listing_id}: ${listing.title?.substring(0, 40)} (not queryable)`);
        continue;
      }
      
      // Check if listing has images (if withImages filter is enabled)
      if (withImages === 'true' && !listing.firstImage) {
        console.log(`❌ Excluding listing ${listing.listing_id}: ${listing.title?.substring(0, 40)} (no images)`);
        continue;
      }
      
      validListings.push(listing);
      console.log(`✅ Including listing ${listing.listing_id}: ${listing.title?.substring(0, 40)}`);
    }
    
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
    const listing = await Listing.findOne({ listing_id: numericId });
    console.log(`📄 Found listing:`, !!listing);
    
    if (listing) {
      console.log(`✅ Listing found: ${listing.title}`);
    } else {
      console.log(`❌ No listing found with ID ${numericId}`);
    }
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }
    res.status(200).json(listing);
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
      withImages = 'true'
    } = req.query;

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

    // Build aggregation pipeline for image-prioritized search
    const pipeline = [
      { $match: matchFilter },
      // Lookup images for each listing
      {
        $lookup: {
          from: 'images',
          localField: 'listing_id',
          foreignField: 'listing_id',
          as: 'images'
        }
      },
      // Add field to count images and determine if listing has images
      {
        $addFields: {
          imageCount: { $size: '$images' },
          hasImages: { $gt: [{ $size: '$images' }, 0] }
        }
      }
    ];

    // Filter only listings with images if withImages is true
    if (withImages === 'true') {
      pipeline.push({
        $match: { hasImages: true }
      });
    }

    // Sort: prioritize listings with images, then by relevance
    pipeline.push({
      $sort: {
        hasImages: -1,      // Listings with images first
        imageCount: -1,     // More images first
        nightly_price: 1    // Lower price first for search results
      }
    });

    // Pagination - query more results if filtering is enabled
    const queryMultiplier = withImages === 'true' ? 10 : 1; // Query 10x more to account for filtering
    pipeline.push(
      { $skip: Number(offset) },
      { $limit: Number(limit) * queryMultiplier }
    );

    // Remove images array from response
    pipeline.push({
      $project: {
        images: 0,
        imageCount: 0,
        hasImages: 0
      }
    });

    let searchMatches = await Listing.aggregate(pipeline);
    
    // Apply same validation filtering as homepage to ensure data integrity
    if (withImages === 'true') {
      console.log('🔧 Filtering search results to only include queryable listings...');
      const validListings = [];
      
      for (const listing of searchMatches) {
        try {
          // Test if listing can be queried directly
          const testListing = await Listing.findOne({ listing_id: listing.listing_id });
          if (testListing) {
            validListings.push(listing);
            console.log(`✅ Including listing ${listing.listing_id}: ${listing.title}`);
          } else {
            console.log(`❌ Excluding listing ${listing.listing_id}: ${listing.title} (not queryable)`);
          }
        } catch (error) {
          console.log(`❌ Excluding listing ${listing.listing_id}: ${listing.title} (query error)`);
        }
        
        // Stop when we have enough valid listings
        if (validListings.length >= Number(limit)) {
          break;
        }
      }
      
      console.log(`📊 Search filtered ${searchMatches.length} -> ${validListings.length} valid listings (target: ${limit})`);
      searchMatches = validListings;
    }

    res.status(200).json(searchMatches);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

exports.triggerDataSync = async (req, res) => {
  try {
    const userData = req.user;
    // Giả định chỉ host có quyền kích hoạt
    if (!userData) {
      return res.status(403).json({ message: 'Unauthorized: Only hosts can sync data' });
    }

    const scriptPath = path.join(__dirname, '../scripts/scrape_data.py'); // Đường dẫn đến script tích hợp
    exec(`python ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).json({ message: 'Error executing data sync script', error: stderr });
      }
      console.log(`Script stdout: ${stdout}`);
      res.status(200).json({ message: 'Data sync completed successfully', output: stdout });
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }
    // Lấy document trước để check quyền
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.host_id !== userData.user_id && userData.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    // Chỉ $set những trường có trong fields
    const updated = await Listing.findByIdAndUpdate(
      id,
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

    // 1) Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // 2) Kiểm tra quyền
    if (listing.host_id !== userData.user_id && userData.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this listing' });
    }

    // 3) Xóa
    await Listing.findByIdAndDelete(id);
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