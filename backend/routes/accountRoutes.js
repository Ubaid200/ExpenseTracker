const express = require('express');
const router = express.Router();
const {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const {
  validateCreateAccount,
  validateUpdateAccount,
} = require('../validators/accountValidator');

router.use(protect);

router
  .route('/')
  .get(getAccounts)
  .post(validateCreateAccount, validate, createAccount);

router
  .route('/:id')
  .get(validateMongoId, validate, getAccountById)
  .put(validateMongoId, validateUpdateAccount, validate, updateAccount)
  .delete(validateMongoId, validate, deleteAccount);

module.exports = router;
