const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// multer
const upload = multer({ dest: '/tmp' });

router.get('/', (req, res) => {
  res.status(200).json({
    greeting: 'Hello from airbnb-clone api',
  });
});

// Upload photo using image URL
router.post('/upload-by-link', async (req, res) => {
  try {
    const { link } = req.body;
    const result = await cloudinary.uploader.upload(link, {
      folder: 'Airbnb/Listings',
    });
    res.json(result.secure_url);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Upload images from local device
router.post('/upload', upload.array('photos', 100), async (req, res) => {
  try {
    const imageArray = [];

    for (let index = 0; index < req.files.length; index++) {
      const { path } = req.files[index];
      const result = await cloudinary.uploader.upload(path, {
        folder: 'Airbnb/Listings',
      });
      imageArray.push(result.secure_url);
    }

    res.status(200).json(imageArray);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
});

router.use('/user', require('./user'));
router.use('/listings', require('./listing'));
router.use('/reservations', require('./reservation'));
router.use('/images', require('./image'));
router.use('/reviews', require('./review'));
router.use('/amenities', require('./amenity'));
router.use('/availability', require('./availability'));

module.exports = router;