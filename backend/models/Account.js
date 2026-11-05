const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide an account name'],
      trim: true,
    },
    accountType: {
      type: String,
      required: [true, 'Please select an account type'],
      enum: ['Cash', 'Bank', 'Mobile Wallet', 'Credit Card'],
      default: 'Cash',
    },
    balance: {
      type: Number,
      required: [true, 'Please specify the starting balance'],
      default: 0,
    },
    currency: {
      type: String,
      enum: ['BDT', 'USD'],
      default: 'BDT',
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
    },
    institutionName: {
      type: String,
      trim: true,
      default: '', // e.g. "bKash", "BRAC Bank", "City Bank Amex"
    },
    creditLimit: {
      type: Number,
      default: 0, // Relevant for Credit Card type
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Account', accountSchema);
