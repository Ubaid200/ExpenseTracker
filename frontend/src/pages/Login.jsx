import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Wallet, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form before submitting
  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMessage(response?.message || 'Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to connect to server. Please try again.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo auto-fill helper for test convenience
  const handleQuickDemo = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'password123',
      rememberMe: true,
    });
    setErrors({});
    setServerError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Left Side: Branding & Features Showcase (Desktop / Tablet) */}
        <div className="auth-showcase">
          <div className="showcase-brand">
            <div className="brand-icon-box">
              <Wallet size={24} />
            </div>
            <div className="brand-name">
              Expense<span>Tracker</span>
            </div>
          </div>

          <div className="showcase-content">
            <h1 className="showcase-headline">
              Take complete control of your financial freedom.
            </h1>
            <p className="showcase-description">
              Track daily expenses, set real-time budgets, and gain deep visual insights into your spending habits effortlessly.
            </p>

            <div className="showcase-cards">
              <div className="preview-stat-card">
                <div className="preview-stat-left">
                  <div className="preview-stat-icon green">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <div className="preview-stat-title">Monthly Savings</div>
                    <div className="preview-stat-sub">+$1,450.00</div>
                  </div>
                </div>
                <div className="preview-stat-badge">+24.8%</div>
              </div>

              <div className="preview-stat-card">
                <div className="preview-stat-left">
                  <div className="preview-stat-icon purple">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="preview-stat-title">Security & Privacy</div>
                    <div className="preview-stat-sub">Bank-Grade Encryption</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <Sparkles size={16} color="#818cf8" />
            <span>Smart budgeting powered for personal & family finance</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="auth-form-panel">
          {/* Mobile Only Brand Header */}
          <div className="mobile-brand-header">
            <div className="brand-icon-box">
              <Wallet size={20} />
            </div>
            <div className="brand-name">
              Expense<span>Tracker</span>
            </div>
          </div>

          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Log in to access your dashboard and expense records</p>
          </div>

          {/* Feedback alerts */}
          {serverError && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={18} className="auth-alert-icon" />
              <span>{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert success" role="alert">
              <CheckCircle2 size={18} className="auth-alert-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Mail size={18} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className={`auth-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && (
                <div className="input-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`auth-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="input-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-extra-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <a 
                href="#forgot-password" 
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset link has been requested. Contact support or check email.');
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Quick Demo Fill Helper */}
            <button
              type="button"
              className="demo-badge-btn"
              onClick={handleQuickDemo}
            >
              <Sparkles size={14} />
              <span>Fill Demo Credentials</span>
            </button>
          </form>

          {/* Switch to Register */}
          <div className="form-footer-link">
            <span>Don't have an account yet?</span>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
