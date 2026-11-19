const express = require('express');
const router = express.Router();
const {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const {
  validateCreateRecurring,
  validateUpdateRecurring,
} = require('../validators/recurringValidator');

router.use(protect);

router
  .route('/')
  .get(getRecurringTransactions)
  .post(validateCreateRecurring, validate, createRecurringTransaction);

router
  .route('/:id')
  .put(validateMongoId, validateUpdateRecurring, validate, updateRecurringTransaction)
  .delete(validateMongoId, validate, deleteRecurringTransaction);

module.exports = router;
