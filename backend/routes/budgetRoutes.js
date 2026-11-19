const express = require('express');
const router = express.Router();
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const {
  validateCreateBudget,
  validateUpdateBudget,
} = require('../validators/budgetValidator');

router.use(protect);

router
  .route('/')
  .get(getBudgets)
  .post(validateCreateBudget, validate, createBudget);

router
  .route('/:id')
  .put(validateMongoId, validateUpdateBudget, validate, updateBudget)
  .delete(validateMongoId, validate, deleteBudget);

module.exports = router;
