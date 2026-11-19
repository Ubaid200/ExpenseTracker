const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to determine budget warning level and message
const getBudgetWarning = (spent, budgetAmount, monthName) => {
  if (budgetAmount <= 0) return { level: 'none', message: '' };
  const percentage = (spent / budgetAmount) * 100;
  const remaining = budgetAmount - spent;

  if (percentage >= 100) {
    const exceeded = Math.abs(remaining);
    return {
      level: 'danger',
      percentage: parseFloat(percentage.toFixed(1)),
      message: `Budget exceeded by ₹${exceeded.toLocaleString('en-IN')}.`,
    };
  } else if (percentage >= 90) {
    return {
      level: 'warning_90',
      percentage: parseFloat(percentage.toFixed(1)),
      message: `You have used ${Math.round(percentage)}% of your ${monthName} budget.`,
    };
  } else if (percentage >= 75) {
    return {
      level: 'warning_75',
      percentage: parseFloat(percentage.toFixed(1)),
      message: `You have reached 75% of your budget.`,
    };
  } else if (percentage >= 50) {
    return {
      level: 'warning_50',
      percentage: parseFloat(percentage.toFixed(1)),
      message: `You have reached 50% of your budget.`,
    };
  }

  return {
    level: 'normal',
    percentage: parseFloat(percentage.toFixed(1)),
    message: `On track (${percentage.toFixed(0)}% used)`,
  };
};

// @desc    Get all budgets (overall + category-specific) with live spent progress & warnings
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();
    const monthName = MONTH_NAMES[month - 1];

    // Get date range for target month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch user's budgets for this month/year
    let budgets = await Budget.find({ user: req.user._id, month, year })
      .populate('category', 'name type icon color');

    // If no overall budget exists, create a default $3,000 overall budget
    let overallBudget = budgets.find((b) => b.isOverall || !b.category);
    if (!overallBudget) {
      overallBudget = await Budget.create({
        user: req.user._id,
        category: null,
        isOverall: true,
        amount: 3000,
        month,
        year,
      });
      budgets.push(overallBudget);
    }

    // 2. Fetch total expenses for this month
    const expenseAgg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const categorySpendMap = {};
    let totalMonthlySpent = 0;
    expenseAgg.forEach((item) => {
      categorySpendMap[item._id ? item._id.toString() : 'other'] = item.totalSpent;
      totalMonthlySpent += item.totalSpent;
    });

    // 3. Format budgets with spent, remaining, percentage, and warnings
    const formattedBudgets = budgets.map((b) => {
      const isOverall = b.isOverall || !b.category;
      const spent = isOverall
        ? totalMonthlySpent
        : categorySpendMap[b.category?._id?.toString()] || 0;
      const remaining = b.amount - spent;
      const warningInfo = getBudgetWarning(spent, b.amount, monthName);

      return {
        _id: b._id,
        isOverall,
        category: b.category,
        amount: b.amount,
        month: b.month,
        year: b.year,
        spent,
        remaining,
        percentageUsed: warningInfo.percentage,
        warningLevel: warningInfo.level,
        warningMessage: warningInfo.message,
      };
    });

    res.status(200).json({
      success: true,
      month,
      year,
      monthName,
      totalMonthlySpent,
      budgets: formattedBudgets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update a budget (overall or category-specific)
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year, isOverall } = req.body;
    const now = new Date();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;
    const targetYear = year ? Number(year) : now.getFullYear();
    const budgetAmount = Number(amount);

    if (!budgetAmount || budgetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid budget amount',
      });
    }

    const query = {
      user: req.user._id,
      month: targetMonth,
      year: targetYear,
    };

    if (isOverall || !category) {
      query.isOverall = true;
    } else {
      query.category = category;
      query.isOverall = false;
    }

    // Upsert budget
    const budget = await Budget.findOneAndUpdate(
      query,
      {
        $set: {
          amount: budgetAmount,
          category: isOverall ? null : category,
          isOverall: !!isOverall,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('category', 'name type icon color');

    res.status(201).json({
      success: true,
      budget,
      message: 'Budget saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget amount
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (req.body.amount !== undefined) {
      budget.amount = Number(req.body.amount);
    }

    await budget.save();
    const populated = await Budget.findById(budget._id).populate('category', 'name type icon color');

    res.status(200).json({
      success: true,
      budget: populated,
      message: 'Budget updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
