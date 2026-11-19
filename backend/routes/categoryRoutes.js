const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const {
  validateCreateCategory,
  validateUpdateCategory,
} = require('../validators/categoryValidator');

router.use(protect);

router
  .route('/')
  .get(getCategories)
  .post(validateCreateCategory, validate, createCategory);

router
  .route('/:id')
  .put(validateMongoId, validateUpdateCategory, validate, updateCategory)
  .delete(validateMongoId, validate, deleteCategory);

module.exports = router;
