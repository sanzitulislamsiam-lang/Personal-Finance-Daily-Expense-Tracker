const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const LOCKABLE_SECTIONS = require('../config/lockableSections');
const { generateUnlockToken, UNLOCK_TTL_SECONDS } = require('../utils/pinToken');

// ---------------------------------------------------------------------------
// R3 helpers
// ---------------------------------------------------------------------------
const MAX_PIN_ATTEMPTS = 5; // wrong guesses allowed before lock-out
const PIN_LOCKOUT_MINUTES = 5; // lock-out duration

const isValidPin = (pin) =>
  (typeof pin === 'string' || typeof pin === 'number') && /^\d{4}$/.test(String(pin));

const lockoutResponse = (until) => ({
  status: 423,
  body: {
    valid: false,
    code: 'PIN_LOCKED_OUT',
    message: `Too many wrong PIN attempts. Try again in ${Math.max(
      1,
      Math.ceil((until - Date.now()) / 60000)
    )} minute(s).`,
    retryAfterSeconds: Math.max(1, Math.ceil((until - Date.now()) / 1000)),
  },
});

// Starts the lock-out (only if one is not already running) and returns when it ends
const startLockout = async (_id) => {
  const until = new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000);
  await User.collection.updateOne(
    { _id, 'privacySettings.pinLockedUntil': null }, // null also matches "field missing"
    { $set: { 'privacySettings.pinLockedUntil': until } }
  );
  const doc = await User.collection.findOne({ _id });
  return doc.privacySettings.pinLockedUntil || until;
};

// Verifies a PIN with brute-force protection.
// Returns null when the PIN is correct, otherwise { status, body } to send back.
//
// Race-safe: "is the user locked out?" and "use up one attempt" are ONE atomic
// database operation, and the attempt is used up BEFORE the PIN is compared.
// So even 1000 parallel requests can only ever get MAX_PIN_ATTEMPTS guesses.
const checkPin = async (userId, pin) => {
  const _id = new mongoose.Types.ObjectId(String(userId));

  // 1. forget a lock-out that has already ended
  await User.collection.updateOne(
    { _id, 'privacySettings.pinLockedUntil': { $lte: new Date() } },
    {
      $set: { 'privacySettings.pinFailedAttempts': 0 },
      $unset: { 'privacySettings.pinLockedUntil': '' },
    }
  );

  // 2. use up one attempt - only matches when the user is NOT locked out
  const reserved = await User.collection.findOneAndUpdate(
    { _id, 'privacySettings.pinLockedUntil': null },
    { $inc: { 'privacySettings.pinFailedAttempts': 1 } },
    { returnDocument: 'after' }
  );

  if (!reserved) {
    // still locked out
    const doc = await User.collection.findOne({ _id });
    return lockoutResponse(doc.privacySettings.pinLockedUntil);
  }

  const attempts = reserved.privacySettings.pinFailedAttempts;
  const pinHash = reserved.privacySettings.securityPin;

  // over the limit (parallel burst) -> refuse without even comparing
  if (attempts > MAX_PIN_ATTEMPTS) {
    return lockoutResponse(await startLockout(_id));
  }

  const ok = Boolean(pinHash) && isValidPin(pin) && (await bcrypt.compare(String(pin), pinHash));
  if (ok) {
    await User.collection.updateOne(
      { _id },
      { $set: { 'privacySettings.pinFailedAttempts': 0 } }
    );
    return null;
  }

  if (attempts >= MAX_PIN_ATTEMPTS) {
    return lockoutResponse(await startLockout(_id));
  }

  return {
    status: 401,
    body: {
      valid: false,
      code: 'PIN_INVALID',
      message: 'Incorrect PIN',
      attemptsRemaining: MAX_PIN_ATTEMPTS - attempts,
    },
  };
};

// ---------------------------------------------------------------------------
// R1: profile
// ---------------------------------------------------------------------------

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
      privacySettings: user.publicPrivacy(),
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (R1: details, avatar, currency; R3: mask-balances flag only)
//          PIN / section locks are NOT changed here - they have dedicated, PIN-verified endpoints.
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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

    // R3: balance masking preference
    if (req.body.privacySettings && typeof req.body.privacySettings.maskBalances === 'boolean') {
      user.privacySettings.maskBalances = req.body.privacySettings.maskBalances;
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
      privacySettings: updatedUser.publicPrivacy(),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// R3: Data Privacy & Security
// ---------------------------------------------------------------------------

// @desc    Update privacy settings: balance masking and which sections are PIN-locked
// @route   PUT /api/users/privacy
// @body    { maskBalances?: boolean, lockedSections?: string[], pin?: string }
//          (pin is required when changing lockedSections while a PIN is enabled)
// @access  Private
const updatePrivacySettings = async (req, res) => {
  try {
    const { maskBalances, lockedSections, pin } = req.body;
    const $set = {};

    // ---- validate everything first (so a bad request never burns a PIN attempt)
    if (maskBalances !== undefined) {
      if (typeof maskBalances !== 'boolean') {
        return res.status(400).json({ message: 'maskBalances must be true or false' });
      }
      $set['privacySettings.maskBalances'] = maskBalances;
    }

    if (lockedSections !== undefined) {
      if (
        !Array.isArray(lockedSections) ||
        lockedSections.some((s) => !LOCKABLE_SECTIONS.includes(s))
      ) {
        return res.status(400).json({
          message: `lockedSections must be an array of: ${LOCKABLE_SECTIONS.join(', ')}`,
        });
      }
      const unique = [...new Set(lockedSections)];

      if (!req.user.privacySettings.pinEnabled) {
        if (unique.length > 0) {
          return res.status(400).json({ message: 'Set a PIN before locking any section' });
        }
      } else {
        const failure = await checkPin(req.user._id, pin);
        if (failure) return res.status(failure.status).json(failure.body);
      }
      $set['privacySettings.lockedSections'] = unique;
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    await User.updateOne({ _id: req.user._id }, { $set });
    const updated = await User.findById(req.user._id);
    res.json({
      privacySettings: updated.publicPrivacy(),
      message: 'Privacy settings updated',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a 4-digit PIN, or change it (needs currentPin when one already exists)
// @route   POST /api/users/pin
// @body    { pin: "1234", currentPin?: "0000" }
// @access  Private
const setPin = async (req, res) => {
  try {
    const { pin, currentPin } = req.body;

    if (!isValidPin(pin)) {
      return res.status(400).json({ message: 'Security PIN must be exactly 4 digits' });
    }

    if (req.user.privacySettings.pinEnabled) {
      const failure = await checkPin(req.user._id, currentPin);
      if (failure) return res.status(failure.status).json(failure.body);
    }

    const hashedPin = await bcrypt.hash(String(pin), await bcrypt.genSalt(10));
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          'privacySettings.securityPin': hashedPin,
          'privacySettings.pinEnabled': true,
          'privacySettings.pinFailedAttempts': 0,
        },
        $unset: { 'privacySettings.pinLockedUntil': '' },
      }
    );
    const updated = await User.findById(req.user._id);

    res.json({
      privacySettings: updated.publicPrivacy(),
      message: req.user.privacySettings.pinEnabled ? 'PIN changed successfully' : 'PIN created successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove the PIN (also removes every section lock)
// @route   DELETE /api/users/pin
// @body    { pin: "1234" }
// @access  Private
const removePin = async (req, res) => {
  try {
    if (!req.user.privacySettings.pinEnabled) {
      return res.status(400).json({ message: 'PIN is not enabled for this account' });
    }

    const failure = await checkPin(req.user._id, req.body.pin);
    if (failure) return res.status(failure.status).json(failure.body);

    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          'privacySettings.pinEnabled': false,
          'privacySettings.lockedSections': [],
          'privacySettings.pinFailedAttempts': 0,
        },
        $unset: {
          'privacySettings.securityPin': '',
          'privacySettings.pinLockedUntil': '',
        },
      }
    );
    const updated = await User.findById(req.user._id);

    res.json({ privacySettings: updated.publicPrivacy(), message: 'PIN removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify the PIN and receive a short-lived unlock token for locked sections
// @route   POST /api/users/verify-pin
// @body    { pin: "1234" }
// @access  Private
const verifyPin = async (req, res) => {
  try {
    if (!req.body.pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }
    if (!req.user.privacySettings.pinEnabled) {
      return res.status(400).json({ message: 'PIN is not enabled for this account' });
    }

    const failure = await checkPin(req.user._id, req.body.pin);
    if (failure) return res.status(failure.status).json(failure.body);

    res.json({
      valid: true,
      message: 'PIN verified successfully',
      unlockToken: generateUnlockToken(req.user._id),
      expiresIn: UNLOCK_TTL_SECONDS,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updatePrivacySettings,
  setPin,
  removePin,
  verifyPin,
};
