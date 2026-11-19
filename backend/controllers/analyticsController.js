const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

// @desc    Get monthly income, monthly expenses & net savings summary
// @route   GET /api/analytics/summary
// @access  Private
const getExpenseSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month !== undefined ? parseInt(month, 10) : now.getMonth() + 1; // 1-12
    const targetYear = year !== undefined ? parseInt(year, 10) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const stats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    stats.forEach((item) => {
      if (item._id === 'income') monthlyIncome = item.total;
      if (item._id === 'expense') monthlyExpenses = item.total;
    });

    const netSavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;

    res.status(200).json({
      success: true,
      month: targetMonth,
      year: targetYear,
      monthlyIncome,
      monthlyExpenses,
      netSavings,
      savingsRate: Math.max(0, parseFloat(savingsRate.toFixed(1))),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category-wise breakdown (pie/donut) computed from real stored transactions
// @route   GET /api/analytics/category-breakdown
// @access  Private
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type = 'expense', startDate, endDate } = req.query;

    const matchQuery = {
      user: new mongoose.Types.ObjectId(req.user._id),
      type,
    };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.date.$lte = end;
      }
    }

    const breakdown = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$categoryInfo.name', 'Other'] },
          color: { $ifNull: ['$categoryInfo.color', '#6366f1'] },
          icon: { $ifNull: ['$categoryInfo.icon', 'Tag'] },
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = breakdown.reduce((acc, curr) => acc + curr.total, 0);

    const formatted = breakdown.map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? parseFloat(((item.total / grandTotal) * 100).toFixed(1)) : 0,
    }));

    res.status(200).json({
      success: true,
      total: grandTotal,
      categories: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spending trends over time switchable between Week | Month | 3 Months | Year
// @route   GET /api/analytics/trends
// @access  Private
const getMonthlyTrends = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query; // 'week' | 'month' | '3months' | 'year'

    const now = new Date();
    let startDate = new Date();
    let dateFormat = '%Y-%m-%d';
    let groupLabels = [];

    if (period === 'week') {
      // Last 7 days
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      dateFormat = '%Y-%m-%d';
    } else if (period === 'month') {
      // Last 30 days
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      dateFormat = '%Y-%m-%d';
    } else if (period === '3months') {
      // Last 3 months
      startDate.setMonth(now.getMonth() - 2);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      dateFormat = '%Y-%m';
    } else if (period === 'year') {
      // Last 12 months
      startDate.setMonth(now.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      dateFormat = '%Y-%m';
    }

    const trends = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            dateStr: { $dateToString: { format: dateFormat, date: '$date' } },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Build map
    const map = {};
    trends.forEach((item) => {
      const { dateStr, type } = item._id;
      if (!map[dateStr]) {
        map[dateStr] = { date: dateStr, income: 0, expense: 0 };
      }
      if (type === 'income') map[dateStr].income = item.total;
      if (type === 'expense') map[dateStr].expense = item.total;
    });

    // Format list sorted chronologically
    const results = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      period,
      trends: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenseSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
};
