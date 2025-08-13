const Listing = require('../models/Listing');
const axios = require('axios'); // Thêm axios
const { exec } = require('child_process');
const City = require('../models/city');
const HomeType = require('../models/HomeType');
const path = require('path');
const mongoose = require('mongoose');

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


// Returns all listings in DB
exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find();
    res.status(200).json(listings);
  } catch (err) {
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
    const listing = await Listing.findOne({ listing_id: id });
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }
    res.status(200).json(listing);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Search listings in the DB
exports.searchListings = async (req, res) => {
  try {
    const { key } = req.params;
    let searchMatches;
    if (!key) {
      searchMatches = await Listing.find();
    } else {
      searchMatches = await Listing.find({ title: { $regex: key, $options: 'i' } });
    }
    res.status(200).json(searchMatches);
  } catch (err) {
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