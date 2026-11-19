const SavingsGoal = require('../models/SavingsGoal');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// @desc    Get all savings goals with progress percentage
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ targetDate: 1 });

    const formatted = goals.map((g) => {
      const progress = g.targetAmount > 0
        ? Math.min(100, parseFloat(((g.currentAmount / g.targetAmount) * 100).toFixed(1)))
        : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);

      return {
        _id: g._id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        color: g.color || '#6366f1',
        progressPercentage: progress,
        remainingAmount: remaining,
        isCompleted: g.currentAmount >= g.targetAmount,
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      goals: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create savings goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount, targetDate, color } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide goal name and target amount',
      });
    }

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name: name.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: currentAmount ? Number(currentAmount) : 0,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      color: color || '#6366f1',
    });

    res.status(201).json({
      success: true,
      goal,
      message: 'Savings goal created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update savings goal or deposit money into goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    const { name, targetAmount, currentAmount, targetDate, color, depositAmount, accountId } = req.body;

    // Handle deposit from account
    if (depositAmount && Number(depositAmount) > 0) {
      const dep = Number(depositAmount);
      goal.currentAmount += dep;

      // Deduct from account if accountId provided
      if (accountId) {
        const acc = await Account.findOne({ _id: accountId, user: req.user._id });
        if (acc) {
          acc.balance -= dep;
          await acc.save();
        }
      }
    }

    if (name) goal.name = name.trim();
    if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined && !depositAmount) goal.currentAmount = Number(currentAmount);
    if (targetDate) goal.targetDate = new Date(targetDate);
    if (color) goal.color = color;

    await goal.save();

    const progress = goal.targetAmount > 0
      ? Math.min(100, parseFloat(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)))
      : 0;

    res.status(200).json({
      success: true,
      goal: {
        ...goal.toObject(),
        progressPercentage: progress,
        remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
        isCompleted: goal.currentAmount >= goal.targetAmount,
      },
      message: 'Savings goal updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    await goal.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Savings goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};
