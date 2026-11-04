const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_finance_tracker_jwt_key_cse470', {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
