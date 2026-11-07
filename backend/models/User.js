const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const LOCKABLE_SECTIONS = require('../config/lockableSections');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password in queries by default
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    },
    preferredCurrency: {
      type: String,
      enum: ['BDT', 'USD'],
      default: 'BDT',
    },
    privacySettings: {
      maskBalances: {
        type: Boolean,
        default: false, // R3: toggle sensitive balance visibility
      },
      pinEnabled: {
        type: Boolean,
        default: false, // R3: PIN-based section locks
      },
      securityPin: {
        type: String,
        select: false, // 4-digit hashed PIN
      },
      // R3: which sections require the PIN (e.g. ['accounts'])
      lockedSections: {
        type: [{ type: String, enum: LOCKABLE_SECTIONS }],
        default: [],
      },
      // R3: brute-force protection for the 4-digit PIN
      pinFailedAttempts: {
        type: Number,
        default: 0,
        select: false,
      },
      pinLockedUntil: {
        type: Date,
        select: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified (Mongoose 7/8/9 async pre-hook)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare entered PIN with hashed PIN
userSchema.methods.matchPin = async function (enteredPin) {
  if (!this.privacySettings.securityPin) return false;
  return await bcrypt.compare(String(enteredPin), this.privacySettings.securityPin);
};

// Only these fields are ever sent to the client (never the PIN hash / attempt counters)
userSchema.methods.publicPrivacy = function () {
  const p = this.privacySettings || {};
  return {
    maskBalances: Boolean(p.maskBalances),
    pinEnabled: Boolean(p.pinEnabled),
    lockedSections: p.lockedSections ? Array.from(p.lockedSections) : [],
  };
};

module.exports = mongoose.model('User', userSchema);
