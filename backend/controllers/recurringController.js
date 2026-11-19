const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// Helper function to advance due date
const getNextDate = (currentDate, frequency) => {
  const d = new Date(currentDate);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
};

// Auto-process due recurring transactions
const processDueRecurringTransactions = async (userId) => {
  try {
    const now = new Date();
    const dueItems = await RecurringTransaction.find({
      user: userId,
      isActive: true,
      nextDueDate: { $lte: now },
    });

    for (const item of dueItems) {
      // 1. Create real transaction
      await Transaction.create({
        user: item.user,
        account: item.account,
        category: item.category,
        type: item.type,
        amount: item.amount,
        date: item.nextDueDate,
        description: item.description || `Recurring ${item.frequency}`,
        note: `Auto-generated recurring (${item.frequency})`,
        isRecurring: true,
        recurringFrequency: item.frequency,
      });

      // 2. Adjust account balance
      const account = await Account.findById(item.account);
      if (account) {
        if (item.type === 'income') {
          account.balance += item.amount;
        } else {
          account.balance -= item.amount;
        }
        await account.save();
      }

      // 3. Advance to next due date
      item.lastProcessedDate = item.nextDueDate;
      item.nextDueDate = getNextDate(item.nextDueDate, item.frequency);
      await item.save();
    }
  } catch (err) {
    console.error('Error auto-processing recurring transactions:', err.message);
  }
};

// @desc    Get all recurring transactions
// @route   GET /api/recurring
// @access  Private
const getRecurringTransactions = async (req, res, next) => {
  try {
    // Process any that are due
    await processDueRecurringTransactions(req.user._id);

    const recurring = await RecurringTransaction.find({ user: req.user._id })
      .populate('account', 'name type color')
      .populate('category', 'name type icon color')
      .sort({ nextDueDate: 1 });

    res.status(200).json({
      success: true,
      count: recurring.length,
      recurring,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create recurring transaction
// @route   POST /api/recurring
// @access  Private
const createRecurringTransaction = async (req, res, next) => {
  try {
    const { account, category, amount, type, frequency, nextDueDate, description, note } = req.body;

    if (!account || !category || !amount || !type || !nextDueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide account, category, amount, type, and next due date',
      });
    }

    const item = await RecurringTransaction.create({
      user: req.user._id,
      account,
      category,
      amount: Number(amount),
      type,
      frequency: frequency || 'monthly',
      nextDueDate: new Date(nextDueDate),
      description: description || '',
      note: note || '',
      isActive: true,
    });

    const populated = await RecurringTransaction.findById(item._id)
      .populate('account', 'name type color')
      .populate('category', 'name type icon color');

    res.status(201).json({
      success: true,
      recurring: populated,
      message: 'Recurring rule created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recurring transaction
// @route   PUT /api/recurring/:id
// @access  Private
const updateRecurringTransaction = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    const { amount, frequency, nextDueDate, isActive, description, note, account, category } = req.body;

    if (amount !== undefined) item.amount = Number(amount);
    if (frequency) item.frequency = frequency;
    if (nextDueDate) item.nextDueDate = new Date(nextDueDate);
    if (isActive !== undefined) item.isActive = isActive;
    if (description !== undefined) item.description = description;
    if (note !== undefined) item.note = note;
    if (account) item.account = account;
    if (category) item.category = category;

    await item.save();

    const populated = await RecurringTransaction.findById(item._id)
      .populate('account', 'name type color')
      .populate('category', 'name type icon color');

    res.status(200).json({
      success: true,
      recurring: populated,
      message: 'Recurring rule updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete recurring transaction
// @route   DELETE /api/recurring/:id
// @access  Private
const deleteRecurringTransaction = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Recurring rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  processDueRecurringTransactions,
};
