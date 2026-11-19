const express = require('express');
const router = express.Router();
const {
  getExpenseSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getExpenseSummary);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/trends', getMonthlyTrends);

module.exports = router;
