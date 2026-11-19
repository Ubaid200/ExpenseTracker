const { body } = require('express-validator');

const validateCreateAccount = [
  body('name')
    .isString()
    .withMessage('Account name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Account name must be between 1 and 50 characters'),
  body('type')
    .optional()
    .isIn(['bank', 'cash', 'credit_card', 'wallet', 'savings', 'other'])
    .withMessage("Invalid account type. Allowed: 'bank', 'cash', 'credit_card', 'wallet', 'savings', 'other'"),
  body('balance')
    .optional()
    .isNumeric()
    .withMessage('Balance must be a valid number'),
  body('currency')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Currency must be 2 to 5 characters long'),
  body('color')
    .optional()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex color code (e.g. #3b82f6)'),
];

const validateUpdateAccount = [
  body('name')
    .optional()
    .isString()
    .withMessage('Account name must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Account name must be between 1 and 50 characters'),
  body('type')
    .optional()
    .isIn(['bank', 'cash', 'credit_card', 'wallet', 'savings', 'other'])
    .withMessage("Invalid account type. Allowed: 'bank', 'cash', 'credit_card', 'wallet', 'savings', 'other'"),
  body('balance')
    .optional()
    .isNumeric()
    .withMessage('Balance must be a valid number'),
  body('color')
    .optional()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex color code (e.g. #3b82f6)'),
];

module.exports = {
  validateCreateAccount,
  validateUpdateAccount,
};
