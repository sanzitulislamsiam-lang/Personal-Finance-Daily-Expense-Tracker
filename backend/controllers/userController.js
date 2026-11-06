const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile (R1)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      preferredCurrency: user.preferredCurrency,
      privacySettings: {
        maskBalances: user.privacySettings.maskBalances,
        pinEnabled: user.privacySettings.pinEnabled,
      },
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (R1: details, avatar, currency; R3: privacy settings)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+privacySettings.securityPin');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic personal details
    if (req.body.name) user.name = req.body.name;
    if (req.body.avatar) user.avatar = req.body.avatar;

    // Update preferred currency (BDT or USD)
    if (req.body.preferredCurrency) {
      if (!['BDT', 'USD'].includes(req.body.preferredCurrency)) {
        return res.status(400).json({ message: 'Preferred currency must be either BDT or USD' });
      }
      user.preferredCurrency = req.body.preferredCurrency;
    }

    // Update Privacy Settings (R3)
    if (req.body.privacySettings) {
      if (typeof req.body.privacySettings.maskBalances === 'boolean') {
        user.privacySettings.maskBalances = req.body.privacySettings.maskBalances;
      }
      if (typeof req.body.privacySettings.pinEnabled === 'boolean') {
        user.privacySettings.pinEnabled = req.body.privacySettings.pinEnabled;
      }
      // Update or create 4-digit security PIN
      if (req.body.privacySettings.securityPin) {
        const pin = req.body.privacySettings.securityPin.toString();
        if (pin.length !== 4 || isNaN(pin)) {
          return res.status(400).json({ message: 'Security PIN must be exactly 4 digits' });
        }
        const salt = await bcrypt.genSalt(10);
        user.privacySettings.securityPin = await bcrypt.hash(pin, salt);
        user.privacySettings.pinEnabled = true;
      }
    }

    // Optional password change
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      preferredCurrency: updatedUser.preferredCurrency,
      privacySettings: {
        maskBalances: updatedUser.privacySettings.maskBalances,
        pinEnabled: updatedUser.privacySettings.pinEnabled,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Verify Security PIN (R3)
// @route   POST /api/users/verify-pin
// @access  Private
const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    // Get user with securityPin
    const user = await User.findById(req.user._id).select('+privacySettings.securityPin');

    if (!user.privacySettings.pinEnabled) {
      return res.status(400).json({ message: 'PIN is not enabled for this account' });
    }

    const isMatch = await user.matchPin(pin);
    if (!isMatch) {
      return res.status(401).json({ valid: false, message: 'Invalid PIN' });
    }

    res.json({ valid: true, message: 'PIN verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// module.exports এখানে আপডেট করো:
module.exports = {
  getUserProfile,
  updateUserProfile,
  verifyPin, // <--- নতুন যোগ করা
};
module.exports = {
  getUserProfile,
  updateUserProfile,
};
