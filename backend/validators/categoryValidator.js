const { body } = require('express-validator');

const validateCreateCategory = [
  body('name')
    .isString()
    .withMessage('Category name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('type')
    .notEmpty()
    .withMessage('Category type is required')
    .isIn(['income', 'expense'])
    .withMessage("Type must be either 'income' or 'expense'"),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icon must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name is too long'),
  body('color')
    .optional()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex color code (e.g. #f59e0b)'),
];

const validateUpdateCategory = [
  body('name')
    .optional()
    .isString()
    .withMessage('Category name must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icon must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name is too long'),
  body('color')
    .optional()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex color code (e.g. #f59e0b)'),
];

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
};
