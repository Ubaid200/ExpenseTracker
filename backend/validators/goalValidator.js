const { body } = require('express-validator');

const validateCreateGoal = [
  body('name')
    .isString()
    .withMessage('Goal name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Goal name is required')
    .isLength({ min: 1, max: 60 })
    .withMessage('Goal name must be between 1 and 60 characters'),
  body('targetAmount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Target amount must be a positive number greater than 0'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount cannot be negative'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid ISO 8601 date string'),
  body('color')
    .optional()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex color code (e.g. #6366f1)'),
];

const validateUpdateGoal = [
  body('name')
    .optional()
    .isString()
    .withMessage('Goal name must be a string')
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage('Goal name must be between 1 and 60 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Target amount must be a positive number greater than 0'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount cannot be negative'),
  body('depositAmount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Deposit amount must be a positive number greater than 0'),
  body('accountId')
    .optional()
    .isMongoId()
    .withMessage('accountId must be a valid MongoDB ObjectId'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid ISO 8601 date string'),
  body('color')
    .optional()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex color code (e.g. #6366f1)'),
];

module.exports = {
  validateCreateGoal,
  validateUpdateGoal,
};
