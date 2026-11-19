const { body } = require('express-validator');

const validateCreateBudget = [
  body('amount')
    .notEmpty()
    .withMessage('Budget amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Budget amount must be a positive number greater than 0'),
  body('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  body('category')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      const regex = /^[0-9a-fA-F]{24}$/;
      if (!regex.test(val)) {
        throw new Error('Category must be null or a valid MongoDB ObjectId');
      }
      return true;
    }),
  body('isOverall')
    .optional()
    .isBoolean()
    .withMessage('isOverall must be a boolean'),
];

const validateUpdateBudget = [
  body('amount')
    .notEmpty()
    .withMessage('Budget amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Budget amount must be a positive number greater than 0'),
];

module.exports = {
  validateCreateBudget,
  validateUpdateBudget,
};
