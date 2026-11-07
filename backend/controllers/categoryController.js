const Category = require('../models/Category');

// Standard default categories to ensure out-of-the-box usability
const defaultCategories = [
  { name: 'Food & Dining', type: 'Expense', icon: 'Utensils', color: '#F97316', isDefault: true },
  { name: 'Groceries', type: 'Expense', icon: 'ShoppingCart', color: '#10B981', isDefault: true },
  { name: 'Transportation', type: 'Expense', icon: 'Car', color: '#3B82F6', isDefault: true },
  { name: 'Housing & Rent', type: 'Expense', icon: 'Home', color: '#6366F1', isDefault: true },
  { name: 'Bills & Utilities', type: 'Expense', icon: 'Zap', color: '#F59E0B', isDefault: true },
  { name: 'Entertainment', type: 'Expense', icon: 'Film', color: '#EC4899', isDefault: true },
  { name: 'Healthcare', type: 'Expense', icon: 'HeartPulse', color: '#EF4444', isDefault: true },
  { name: 'Shopping', type: 'Expense', icon: 'ShoppingBag', color: '#8B5CF6', isDefault: true },
  { name: 'Education', type: 'Expense', icon: 'GraduationCap', color: '#06B6D4', isDefault: true },
  { name: 'Personal Care', type: 'Expense', icon: 'Sparkles', color: '#D946EF', isDefault: true },
  { name: 'Other Expense', type: 'Expense', icon: 'MoreHorizontal', color: '#64748B', isDefault: true },
  // Income categories (ready for R5)
  { name: 'Salary', type: 'Income', icon: 'Briefcase', color: '#10B981', isDefault: true },
  { name: 'Freelancing', type: 'Income', icon: 'Laptop', color: '#06B6D4', isDefault: true },
  { name: 'Business / Profit', type: 'Income', icon: 'TrendingUp', color: '#3B82F6', isDefault: true },
  { name: 'Investments & Dividends', type: 'Income', icon: 'PieChart', color: '#8B5CF6', isDefault: true },
  { name: 'Gifts & Allowance', type: 'Income', icon: 'Gift', color: '#EC4899', isDefault: true },
  { name: 'Other Income', type: 'Income', icon: 'PlusCircle', color: '#64748B', isDefault: true },
];

// @desc    Get categories (system default + user's custom)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;

    // Check if defaults need seeding
    const defaultCount = await Category.countDocuments({ isDefault: true });
    if (defaultCount === 0) {
      await Category.insertMany(defaultCategories);
    }

    const filter = {
      $or: [{ user: req.user._id }, { isDefault: true }],
    };

    if (type) {
      filter.$and = [{ $or: [{ type }, { type: 'Both' }] }];
    }

    const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color, parentCategory } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists for user
    const existing = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      type: type || 'Expense',
    });

    if (existing) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const category = await Category.create({
      user: req.user._id,
      name: name.trim(),
      type: type || 'Expense',
      icon: icon || 'Tag',
      color: color || '#EF4444',
      isDefault: false,
      parentCategory: parentCategory || null,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
};
