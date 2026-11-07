const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');
const { requirePinUnlock } = require('../middleware/pinMiddleware');

router.use(protect); // All account routes require authentication
router.use(requirePinUnlock('accounts')); // R3: PIN lock (only if the user locked "accounts")

router.route('/')
  .get(getAccounts)
  .post(createAccount);

router.route('/:id')
  .get(getAccountById)
  .put(updateAccount)
  .delete(deleteAccount);

module.exports = router;
