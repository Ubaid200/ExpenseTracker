import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Wallet, 
  ArrowRight, 
  PieChart, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#ef4444', width: '25%' };
      case 2:
        return { score: 2, label: 'Fair', color: '#f59e0b', width: '50%' };
      case 3:
        return { score: 3, label: 'Good', color: '#3b82f6', width: '75%' };
      case 4:
      default:
        return { score: 4, label: 'Strong', color: '#10b981', width: '100%' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept the terms of service';
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
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMessage(response?.message || 'Registration successful! Welcome aboard.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to register account. Please try again.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Left Side: Showcase & Features Panel */}
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
              Smart financial management starts here.
            </h1>
            <p className="showcase-description">
              Join thousands who track expenses, monitor recurring bills, set budget targets, and save more every month.
            </p>

            <div className="showcase-cards">
              <div className="preview-stat-card">
                <div className="preview-stat-left">
                  <div className="preview-stat-icon purple">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <div className="preview-stat-title">Smart Categories</div>
                    <div className="preview-stat-sub">Automated Expense Tagging</div>
                  </div>
                </div>
              </div>

              <div className="preview-stat-card">
                <div className="preview-stat-left">
                  <div className="preview-stat-icon green">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="preview-stat-title">Data Privacy</div>
                    <div className="preview-stat-sub">100% Encrypted & Safe</div>
                  </div>
                </div>
                <div className="preview-stat-badge">Secure</div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <Sparkles size={16} color="#818cf8" />
            <span>Create your free account in under 30 seconds</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="auth-form-panel">
          {/* Mobile Only Header */}
          <div className="mobile-brand-header">
            <div className="brand-icon-box">
              <Wallet size={20} />
            </div>
            <div className="brand-name">
              Expense<span>Tracker</span>
            </div>
          </div>

          <div className="form-header">
            <h2>Create an Account</h2>
            <p>Start tracking your income, expenses & savings today</p>
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
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="register-name">
                Full Name
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <User size={18} />
                </span>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  className={`auth-input ${errors.name ? 'has-error' : ''}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
              {errors.name && (
                <div className="input-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="register-email">
                Email Address
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Mail size={18} />
                </span>
                <input
                  id="register-email"
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

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="register-password">
                Password
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`auth-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

              {/* Password strength meter */}
              {formData.password && (
                <div className="password-strength-container">
                  <div className="strength-bar-track">
                    <div 
                      className="strength-bar-fill" 
                      style={{ 
                        width: passwordStrength.width, 
                        backgroundColor: passwordStrength.color 
                      }} 
                    />
                  </div>
                  <div className="strength-label">
                    <span>Password Strength</span>
                    <span style={{ color: passwordStrength.color, fontWeight: 600 }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <div className="input-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm-password">
                Confirm Password
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`auth-input ${errors.confirmPassword ? 'has-error' : ''}`}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="input-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <span>
                  I agree to the{' '}
                  <a 
                    href="#terms" 
                    className="terms-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Terms and Conditions: Use responsibly to manage personal expenses.');
                    }}
                  >
                    Terms of Service
                  </a>{' '}
                  and Privacy Policy
                </span>
              </label>
              {errors.agreeTerms && (
                <div className="input-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.agreeTerms}</span>
                </div>
              )}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="form-footer-link">
            <span>Already have an account?</span>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
