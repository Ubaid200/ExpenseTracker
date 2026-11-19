const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const RecurringTransaction = require('../models/RecurringTransaction');
const { processDueRecurringTransactions } = require('./recurringController');
const { escapeRegex } = require('../utils/regexUtil');

// @desc    Get all transactions with backend pagination, search, and combinable filters
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    // 1. Process any due recurring transactions first
    await processDueRecurringTransactions(req.user._id);

    const {
      page = 1,
      limit = 10,
      type,
      category,
      account,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { user: req.user._id };

    // Filter by type (income / expense)
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by account
    if (account) {
      query.account = account;
    }

    // Filter by Date Range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Filter by Amount Range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // Search by note, description, or exact amount
    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      const searchNum = Number(search.trim());

      const orConditions = [
        { note: searchRegex },
        { description: searchRegex },
      ];

      if (!isNaN(searchNum) && searchNum > 0) {
        orConditions.push({ amount: searchNum });
      }

      query.$or = orConditions;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('category', 'name type icon color')
        .populate('account', 'name type color')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const {
      amount,
      type,
      category,
      account,
      note,
      description,
      date,
      attachment,
      isRecurring,
      recurringFrequency,
    } = req.body;

    if (!amount || !type || !category || !account) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount, type, category, and account',
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Verify account belongs to user
    const targetAccount = await Account.findOne({ _id: account, user: req.user._id });
    if (!targetAccount) {
      return res.status(404).json({
        success: false,
        message: 'Selected account not found',
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      amount: numAmount,
      type,
      category,
      account,
      note: note || '',
      description: description || note || '',
      date: date ? new Date(date) : new Date(),
      attachment: attachment || '',
      isRecurring: !!isRecurring,
      recurringFrequency: isRecurring ? (recurringFrequency || 'monthly') : '',
    });

    // Update account balance
    if (type === 'income') {
      targetAccount.balance += numAmount;
    } else {
      targetAccount.balance -= numAmount;
    }
    await targetAccount.save();

    // If recurring toggle was checked, also register in RecurringTransaction
    if (isRecurring && recurringFrequency) {
      const nextDate = new Date(date || Date.now());
      switch (recurringFrequency) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      await RecurringTransaction.create({
        user: req.user._id,
        account,
        category,
        amount: numAmount,
        type,
        frequency: recurringFrequency,
        nextDueDate: nextDate,
        description: description || note || '',
        note: note || '',
        isActive: true,
      });
    }

    const populated = await Transaction.findById(transaction._id)
      .populate('category', 'name type icon color')
      .populate('account', 'name type color');

    res.status(201).json({
      success: true,
      transaction: populated,
      message: 'Transaction recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id })
      .populate('category', 'name type icon color')
      .populate('account', 'name type color');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const oldAccount = await Account.findById(transaction.account);
    const { amount, type, category, account, note, description, date, attachment } = req.body;

    // 1. Revert previous transaction impact on old account
    if (oldAccount) {
      if (transaction.type === 'income') {
        oldAccount.balance -= transaction.amount;
      } else {
        oldAccount.balance += transaction.amount;
      }
      await oldAccount.save();
    }

    // 2. Update transaction fields
    if (amount !== undefined) transaction.amount = Number(amount);
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (account) transaction.account = account;
    if (note !== undefined) transaction.note = note;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (attachment !== undefined) transaction.attachment = attachment;

    await transaction.save();

    // 3. Apply new transaction impact to target account
    const newTargetAccount = await Account.findById(transaction.account);
    if (newTargetAccount) {
      if (transaction.type === 'income') {
        newTargetAccount.balance += transaction.amount;
      } else {
        newTargetAccount.balance -= transaction.amount;
      }
      await newTargetAccount.save();
    }

    const populated = await Transaction.findById(transaction._id)
      .populate('category', 'name type icon color')
      .populate('account', 'name type color');

    res.status(200).json({
      success: true,
      transaction: populated,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Revert balance in account
    const account = await Account.findById(transaction.account);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      await account.save();
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted and account balance updated',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export transactions as CSV with active filters applied
// @route   GET /api/transactions/export/csv
// @access  Private
const exportTransactionsCSV = async (req, res, next) => {
  try {
    const {
      type,
      category,
      account,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { user: req.user._id };

    // Filter by type (income / expense)
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by account
    if (account) {
      query.account = account;
    }

    // Filter by Date Range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Filter by Amount Range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // Search by note, description, or amount
    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      const searchNum = Number(search.trim());

      const orConditions = [
        { note: searchRegex },
        { description: searchRegex },
      ];

      if (!isNaN(searchNum) && searchNum > 0) {
        orConditions.push({ amount: searchNum });
      }

      query.$or = orConditions;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch all matching records without pagination limit
    const transactions = await Transaction.find(query)
      .populate('category', 'name')
      .populate('account', 'name')
      .sort(sortOptions);

    // CSV Escape helper with Formula Injection Prevention
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      // Neutralize spreadsheet formula injection (=, +, -, @)
      if (/^[=\-+@]/.test(str)) {
        str = `'${str}`;
      }
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // CSV Header matching exact requirement:
    // Date,Type,Category,Account,Amount,Note
    const headers = ['Date', 'Type', 'Category', 'Account', 'Amount', 'Note'];
    const rows = transactions.map((tx) => {
      const d = tx.date ? new Date(tx.date) : new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const typeStr = tx.type === 'income' ? 'Income' : 'Expense';
      const catStr = tx.category?.name || 'Other';
      const accStr = tx.account?.name || 'Default';
      const amtStr = tx.amount;
      const noteStr = tx.note || tx.description || '';

      return [
        dateStr,
        typeStr,
        escapeCSV(catStr),
        escapeCSV(accStr),
        amtStr,
        escapeCSV(noteStr),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const today = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${today}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCSV,
};
