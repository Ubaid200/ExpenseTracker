const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const {
  validateCreateGoal,
  validateUpdateGoal,
} = require('../validators/goalValidator');

router.use(protect);

router
  .route('/')
  .get(getGoals)
  .post(validateCreateGoal, validate, createGoal);

router
  .route('/:id')
  .put(validateMongoId, validateUpdateGoal, validate, updateGoal)
  .delete(validateMongoId, validate, deleteGoal);

module.exports = router;
