const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updatePrivacySettings,
  setPin,
  removePin,
  verifyPin,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// R1: profile
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// R3: data privacy & security
router.put('/privacy', protect, updatePrivacySettings);
router.route('/pin')
  .post(protect, setPin)
  .delete(protect, removePin);
router.post('/verify-pin', protect, verifyPin);

module.exports = router;
