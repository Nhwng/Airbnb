
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: './tmp/' });
const { isAdmin } = require('../middlewares/admin');
const { isLoggedIn } = require('../middlewares/user');
const {
  register,
  login,
  logout,
  facebookLogin,
  uploadPicture,
  updateUserDetails,
  verifyEmailPin,
  requestHostRole,
  handleHostRequest,
} = require('../controllers/userController');
// Guest gửi yêu cầu đăng ký làm host
router.route('/request-host').post(isLoggedIn, requestHostRole);
// Admin duyệt hoặc từ chối yêu cầu làm host
router.route('/handle-host-request').post(isAdmin, handleHostRequest);

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/facebook/login').post(require('../controllers/userController').facebookLogin);
router.route('/upload-picture').post(isLoggedIn, upload.single('picture', 1), uploadPicture);
router.route('/update-user').put(isLoggedIn, updateUserDetails);
router.route('/logout').get(logout);
router.route('/resend-email-pin').post(require('../controllers/userController').resendEmailPin);
router.route('/verify-email-pin').post(verifyEmailPin);

module.exports = router;
