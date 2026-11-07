const jwt = require('jsonwebtoken');

const secret = () =>
  process.env.JWT_SECRET || 'supersecret_finance_tracker_jwt_key_cse470';

// How long a section stays unlocked after the correct PIN (seconds)
const UNLOCK_TTL_SECONDS = 10 * 60;

// Short-lived token proving "this user just entered the correct PIN"
const generateUnlockToken = (userId) =>
  jwt.sign({ id: String(userId), purpose: 'pin-unlock' }, secret(), {
    expiresIn: UNLOCK_TTL_SECONDS,
  });

// Returns true only if token is valid, not expired, made for PIN unlock and belongs to userId
const verifyUnlockToken = (token, userId) => {
  try {
    const decoded = jwt.verify(token, secret());
    return decoded.purpose === 'pin-unlock' && decoded.id === String(userId);
  } catch (err) {
    return false;
  }
};

module.exports = { generateUnlockToken, verifyUnlockToken, UNLOCK_TTL_SECONDS };
