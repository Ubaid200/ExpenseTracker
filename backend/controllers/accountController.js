const Account = require('../models/Account');

const DEFAULT_ACCOUNTS = [
  { name: 'Bank Account', type: 'bank', balance: 5000, color: '#3b82f6' },
  { name: 'Cash', type: 'cash', balance: 450, color: '#10b981' },
  { name: 'Wallet', type: 'wallet', balance: 250, color: '#8b5cf6' },
  { name: 'Credit Card', type: 'credit_card', balance: -320, color: '#f43f5e' },
  { name: 'Savings', type: 'savings', balance: 3500, color: '#06b6d4' },
];

// Helper to seed user's starter accounts if empty
const seedDefaultAccounts = async (userId) => {
  const count = await Account.countDocuments({ user: userId });
  if (count === 0) {
    const starter = DEFAULT_ACCOUNTS.map(a => ({ ...a, user: userId }));
    await Account.insertMany(starter);
  }
};

// @desc    Get all accounts for current user & combined total
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res, next) => {
  try {
    await seedDefaultAccounts(req.user._id);

    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 });

    const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);

    res.status(200).json({
      success: true,
      count: accounts.length,
      totalBalance,
      accounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new account
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res, next) => {
  try {
    const { name, type, balance, color, currency } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an account name',
      });
    }

    const account = await Account.create({
      user: req.user._id,
      name: name.trim(),
      type: type || 'bank',
      balance: balance !== undefined ? Number(balance) : 0,
      color: color || '#6366f1',
      currency: currency || 'INR',
    });

    res.status(201).json({
      success: true,
      account,
      message: 'Account created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get account by ID
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.status(200).json({ success: true, account });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const { name, type, balance, color } = req.body;
    if (name) account.name = name.trim();
    if (type) account.type = type;
    if (balance !== undefined) account.balance = Number(balance);
    if (color) account.color = color;

    await account.save();

    res.status(200).json({
      success: true,
      account,
      message: 'Account updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    await account.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
};
