import React, { useState, useCallback, useEffect } from 'react';
import LiquidGradientBackground from '../components/LiquidGradientBackground';
import { useCustomCursor } from '../hooks/useCustomCursor';
import '../style/auth.css';
import { registerUser } from "../api/auth.js";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { checkUsername } from '../api/authApi';
import { API_URL } from '../api/config';



const SignupPage = () => {


  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/homepage" replace />;
  }


  const [sceneManager, setSceneManager] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, suggestions: [] });
  const { cursorRef, enlargeCursor, resetCursor } = useCustomCursor();

  const handleSceneReady = useCallback((manager) => {
    setSceneManager(manager);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Debounced username check
  useEffect(() => {
    if (formData.username.length >= 3) {
      const timer = setTimeout(async () => {
        setUsernameStatus({ checking: true, available: null, suggestions: [] });
        try {
          const result = await checkUsername(formData.username);
          setUsernameStatus({
            checking: false,
            available: result.available,
            suggestions: result.suggestions || []
          });
        } catch (error) {
          setUsernameStatus({ checking: false, available: null, suggestions: [] });
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    } else {
      setUsernameStatus({ checking: false, available: null, suggestions: [] });
    }
  }, [formData.username]);

  const handleSuggestionClick = (suggestion) => {
    setFormData(prev => ({ ...prev, username: suggestion }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        const res = await axios.post(`${API_URL}/auth/register`, {
          name: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        console.log("Signup response:", res.data);

        // Save token and user ID & redirect
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user.id);
        navigate("/homepage", { replace: true });
      } catch (err) {
        console.error("Signup error:", err.response?.data || err.message);
        setErrors({ general: err.response?.data?.message || "Signup failed" });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="auth-page" style={{ cursor: 'none' }}>
      {/* Liquid Gradient Background */}
      <LiquidGradientBackground onSceneReady={handleSceneReady} />

      {/* Navigation */}
      <nav className="auth-navbar">
        <a
          href="/"
          className="auth-logo"
          onMouseEnter={enlargeCursor}
          onMouseLeave={resetCursor}
        >
          Cohort
        </a>
        <a
          href="/login"
          className="auth-nav-link"
          onMouseEnter={enlargeCursor}
          onMouseLeave={resetCursor}
        >
          Sign In
        </a>
      </nav>

      {/* Signup Form Container */}
      <div className="auth-container">
        <div
          className="auth-card"
          onMouseEnter={enlargeCursor}
          onMouseLeave={resetCursor}
        >
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join Cohort to start building your community</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`form-input ${errors.fullName ? 'error' : ''}`}
                placeholder="John Doe"
                onMouseEnter={enlargeCursor}
                onMouseLeave={resetCursor}
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errors.username ? 'error' : ''} ${usernameStatus.available === false ? 'error' : ''} ${usernameStatus.available === true ? 'success' : ''}`}
                placeholder="johndoe"
                onMouseEnter={enlargeCursor}
                onMouseLeave={resetCursor}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}

              {/* Username status indicator */}
              {usernameStatus.checking && (
                <span className="username-status checking">Checking availability...</span>
              )}
              {!usernameStatus.checking && usernameStatus.available === true && (
                <span className="username-status available">✓ Username is available</span>
              )}
              {!usernameStatus.checking && usernameStatus.available === false && (
                <>
                  <span className="username-status taken">✗ Username is taken</span>
                  {usernameStatus.suggestions.length > 0 && (
                    <div className="username-suggestions">
                      <p className="suggestions-label">Try these:</p>
                      <div className="suggestions-list">
                        {usernameStatus.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="suggestion-btn"
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={enlargeCursor}
                            onMouseLeave={resetCursor}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="your@email.com"
                onMouseEnter={enlargeCursor}
                onMouseLeave={resetCursor}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a strong password"
                onMouseEnter={enlargeCursor}
                onMouseLeave={resetCursor}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                onMouseEnter={enlargeCursor}
                onMouseLeave={resetCursor}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="checkbox-input"
                  onMouseEnter={enlargeCursor}
                  onMouseLeave={resetCursor}
                />
                <span className="checkbox-text">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    className="inline-link"
                    onMouseEnter={enlargeCursor}
                    onMouseLeave={resetCursor}
                  >
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a
                    href="/privacy"
                    className="inline-link"
                    onMouseEnter={enlargeCursor}
                    onMouseLeave={resetCursor}
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
            </div>

            <button
              type="submit"
              className="submit-btn"
              onMouseEnter={enlargeCursor}
              onMouseLeave={resetCursor}
            >
              Create Account
            </button>
          </form>

          <div className="auth-divider">
            <span>or sign up with</span>
          </div>

          <div className="social-buttons">
            <button
              className="social-btn"
              onMouseEnter={enlargeCursor}
              onMouseLeave={resetCursor}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.879 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="#4285F4" />
                <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="#34A853" />
                <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0 8.36008 0 9.96565C0 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="#FBBC05" />
                <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="#EB4335" />
              </svg>
              Google
            </button>
            <button
              className="social-btn"
              onMouseEnter={enlargeCursor}
              onMouseLeave={resetCursor}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M20 10.0611C20 4.504 15.5229 0 10 0C4.47715 0 0 4.504 0 10.0611C0 15.0828 3.65684 19.2452 8.4375 20V12.9694H5.89844V10.0611H8.4375V7.84452C8.4375 5.32296 9.93047 3.93012 12.2146 3.93012C13.3084 3.93012 14.4531 4.12663 14.4531 4.12663V6.60261H13.1922C11.95 6.60261 11.5625 7.37822 11.5625 8.17403V10.0611H14.3359L13.8926 12.9694H11.5625V20C16.3432 19.2452 20 15.0828 20 10.0611Z" fill="#1877F2" />
              </svg>
              Facebook
            </button>
          </div>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <a
              href="/login"
              className="auth-link"
              onMouseEnter={enlargeCursor}
              onMouseLeave={resetCursor}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor">
        <div className="cursor-dot" />
      </div>
    </div>
  );
};

export default SignupPage;
