const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Expense', 'Income', 'Both'],
      default: 'Expense',
      required: true,
    },
    icon: {
      type: String,
      default: 'Tag', // Lucide icon identifier
    },
    color: {
      type: String,
      default: '#EF4444', // Hex color badge for UI
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null indicates system-wide default category
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // For subcategories per class diagram
    },
  },
  {
    timestamps: true,
  }
);

// Index to prevent duplicate category names for the same user
categorySchema.index({ user: 1, name: 1, type: 1 });

module.exports = mongoose.model('Category', categorySchema);
