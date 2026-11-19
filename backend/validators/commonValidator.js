const { param } = require('express-validator');

// Validates that :id is a 24-character hexadecimal MongoDB ObjectId
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format. Must be a valid MongoDB ObjectId'),
];

module.exports = { validateMongoId };
