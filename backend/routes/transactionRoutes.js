const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCSV,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const {
  validateCreateTransaction,
  validateUpdateTransaction,
} = require('../validators/transactionValidator');

router.use(protect);

router.get('/export/csv', exportTransactionsCSV);

router
  .route('/')
  .get(getTransactions)
  .post(validateCreateTransaction, validate, createTransaction);

router
  .route('/:id')
  .get(validateMongoId, validate, getTransactionById)
  .put(validateMongoId, validateUpdateTransaction, validate, updateTransaction)
  .delete(validateMongoId, validate, deleteTransaction);

module.exports = router;
