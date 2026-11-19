const { body } = require('express-validator');

const validateCreateRecurring = [
  body('account')
    .notEmpty()
    .withMessage('Account is required')
    .isMongoId()
    .withMessage('Account must be a valid MongoDB ObjectId'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['income', 'expense'])
    .withMessage("Type must be either 'income' or 'expense'"),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage("Frequency must be 'daily', 'weekly', 'monthly', or 'yearly'"),
  body('nextDueDate')
    .notEmpty()
    .withMessage('Next due date is required')
    .isISO8601()
    .withMessage('Next due date must be a valid ISO 8601 date string'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('note')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),
];

const validateUpdateRecurring = [
  body('account')
    .optional()
    .isMongoId()
    .withMessage('Account must be a valid MongoDB ObjectId'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage("Frequency must be 'daily', 'weekly', 'monthly', or 'yearly'"),
  body('nextDueDate')
    .optional()
    .isISO8601()
    .withMessage('Next due date must be a valid ISO 8601 date string'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('note')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),
];

module.exports = {
  validateCreateRecurring,
  validateUpdateRecurring,
};
