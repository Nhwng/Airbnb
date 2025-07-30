const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ dest: './tmp/' });

const {
  register,
  login,
  logout,
  googleLogin,
  uploadPicture,
  updateUserDetails,
  verifyEmailPin,
} = require('../controllers/userController');
const { isLoggedIn } = require('../middlewares/user');

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/google/login').post(googleLogin);
router.route('/facebook/login').post(require('../controllers/userController').facebookLogin);
router.route('/upload-picture').post(isLoggedIn, upload.single('picture', 1), uploadPicture);
router.route('/update-user').put(isLoggedIn, updateUserDetails);
router.route('/logout').get(logout);
router.route('/resend-email-pin').post(require('../controllers/userController').resendEmailPin);
router.route('/verify-email-pin').post(verifyEmailPin);

module.exports = router;