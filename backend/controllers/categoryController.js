const Category = require('../models/Category');
const { escapeRegex } = require('../utils/regexUtil');

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: 'Utensils', color: '#f59e0b' },
  { name: 'Travel', type: 'expense', icon: 'Plane', color: '#3b82f6' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Bills', type: 'expense', icon: 'Receipt', color: '#8b5cf6' },
  { name: 'Rent', type: 'expense', icon: 'Home', color: '#ef4444' },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#a855f7' },
  { name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#10b981' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#06b6d4' },
  { name: 'Subscription', type: 'expense', icon: 'CreditCard', color: '#f97316' },
  { name: 'Other', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#06b6d4' },
  { name: 'Business', type: 'income', icon: 'TrendingUp', color: '#6366f1' },
  { name: 'Investment', type: 'income', icon: 'Coins', color: '#f59e0b' },
  { name: 'Gift', type: 'income', icon: 'Gift', color: '#ec4899' },
  { name: 'Other', type: 'income', icon: 'MoreHorizontal', color: '#64748b' },
];

// Helper to seed defaults if not in database
const seedDefaultCategories = async () => {
  const count = await Category.countDocuments({ user: null });
  if (count === 0) {
    const defaults = [
      ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ ...c, isDefault: true, user: null })),
      ...DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, isDefault: true, user: null })),
    ];
    await Category.insertMany(defaults);
  }
};

// @desc    Get all categories (system defaults + user custom)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    await seedDefaultCategories();

    // Find defaults (user: null) or categories created by this user
    const categories = await Category.find({
      $or: [{ user: null }, { user: req.user._id }],
    }).sort({ type: 1, isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category name and type (income/expense)',
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either income or expense',
      });
    }

    // Check if category with this name already exists for user (using safe regex)
    const safeName = escapeRegex(name.trim());
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${safeName}$`, 'i') },
      type,
      $or: [{ user: null }, { user: req.user._id }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    const category = await Category.create({
      user: req.user._id,
      name: name.trim(),
      type,
      icon: icon || 'Tag',
      color: color || '#6366f1',
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      category,
      message: 'Custom category created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update custom category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.isDefault || !category.user) {
      return res.status(400).json({ success: false, message: 'Cannot edit system default categories' });
    }

    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this category' });
    }

    const { name, color, icon } = req.body;
    if (name) category.name = name.trim();
    if (color) category.color = color;
    if (icon) category.icon = icon;

    await category.save();

    res.status(200).json({
      success: true,
      category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.isDefault || !category.user) {
      return res.status(400).json({ success: false, message: 'Cannot delete system default categories' });
    }

    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this category' });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
