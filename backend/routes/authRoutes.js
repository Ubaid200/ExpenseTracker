const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  validateRegister,
  validateLogin,
} = require('../validators/authValidator');

router.post('/register', authLimiter, validateRegister, validate, registerUser);
router.post('/login', authLimiter, validateLogin, validate, loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

module.exports = router;
