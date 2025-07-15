const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/user');

const {
  addImage,
  getImages,
  deleteImage,
} = require('../controllers/imageController');

router.route('/:listing_id').get(getImages);
router.route('/').post(isLoggedIn, addImage);
router.route('/:listing_id/:url').delete(isLoggedIn, deleteImage);

module.exports = router;