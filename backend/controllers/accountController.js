const Account = require('../models/Account');

// @desc    Get all accounts of logged-in user
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });

    // Calculate aggregated balances
    const totalBalance = accounts.reduce((acc, curr) => {
      // If it's a credit card with negative balance/debt vs positive asset accounts
      return acc + (curr.balance || 0);
    }, 0);

    const breakdownByType = accounts.reduce((acc, curr) => {
      acc[curr.accountType] = (acc[curr.accountType] || 0) + curr.balance;
      return acc;
    }, {});

    res.json({
      accounts,
      summary: {
        totalAccounts: accounts.length,
        totalBalance,
        breakdownByType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single account details
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new account
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res) => {
  try {
    const { name, accountType, balance, accountNumber, institutionName, creditLimit, notes, isDefault } = req.body;

    if (!name || !accountType) {
      return res.status(400).json({ message: 'Please provide account name and account type' });
    }

    // If marked as default, reset existing defaults
    if (isDefault) {
      await Account.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const account = await Account.create({
      user: req.user._id,
      name,
      accountType,
      balance: Number(balance) || 0,
      currency: req.user.preferredCurrency || 'BDT',
      accountNumber: accountNumber || '',
      institutionName: institutionName || '',
      creditLimit: Number(creditLimit) || 0,
      isDefault: Boolean(isDefault),
      notes: notes || '',
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const { name, accountType, balance, accountNumber, institutionName, creditLimit, notes, isDefault } = req.body;

    if (isDefault) {
      await Account.updateMany({ user: req.user._id, _id: { $ne: account._id } }, { isDefault: false });
    }

    account.name = name !== undefined ? name : account.name;
    account.accountType = accountType !== undefined ? accountType : account.accountType;
    account.balance = balance !== undefined ? Number(balance) : account.balance;
    account.accountNumber = accountNumber !== undefined ? accountNumber : account.accountNumber;
    account.institutionName = institutionName !== undefined ? institutionName : account.institutionName;
    account.creditLimit = creditLimit !== undefined ? Number(creditLimit) : account.creditLimit;
    account.notes = notes !== undefined ? notes : account.notes;
    if (isDefault !== undefined) account.isDefault = Boolean(isDefault);

    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete account
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Soft delete so historical transaction records remain intact
    account.isActive = false;
    await account.save();

    res.json({ message: 'Account removed successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
};
