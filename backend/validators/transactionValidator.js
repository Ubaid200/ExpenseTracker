const { body } = require('express-validator');

const validateCreateTransaction = [
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
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('account')
    .notEmpty()
    .withMessage('Account is required')
    .isMongoId()
    .withMessage('Account must be a valid MongoDB ObjectId'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date string'),
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('attachment')
    .optional()
    .isString()
    .withMessage('Attachment must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Attachment path/URL is too long'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly', ''])
    .withMessage("Invalid recurring frequency. Allowed: 'daily', 'weekly', 'monthly', 'yearly'"),
];

const validateUpdateTransaction = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage("Type must be either 'income' or 'expense'"),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('account')
    .optional()
    .isMongoId()
    .withMessage('Account must be a valid MongoDB ObjectId'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date string'),
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('attachment')
    .optional()
    .isString()
    .withMessage('Attachment must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Attachment path/URL is too long'),
];

module.exports = {
  validateCreateTransaction,
  validateUpdateTransaction,
};
