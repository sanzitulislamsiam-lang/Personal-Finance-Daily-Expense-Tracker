const { verifyUnlockToken } = require('../utils/pinToken');

// R3: Server-side PIN section lock.
// Usage: router.use(protect, requirePinUnlock('accounts'));
// If the user locked this section, the request must carry a valid
// "x-pin-token" header (obtained from POST /api/users/verify-pin).
const requirePinUnlock = (section) => (req, res, next) => {
  const privacy = req.user && req.user.privacySettings;
  const isLocked =
    privacy &&
    privacy.pinEnabled &&
    Array.isArray(privacy.lockedSections) &&
    privacy.lockedSections.includes(section);

  if (!isLocked) return next();

  const token = req.headers['x-pin-token'];
  if (token && verifyUnlockToken(token, req.user._id)) return next();

  return res.status(423).json({
    code: 'PIN_REQUIRED',
    section,
    message: `The "${section}" section is locked. Enter your PIN to continue.`,
  });
};

module.exports = { requirePinUnlock };
