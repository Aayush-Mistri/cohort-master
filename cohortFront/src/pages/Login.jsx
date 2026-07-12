import React, { useState, useCallback } from 'react';
import LiquidGradientBackground from '../components/LiquidGradientBackground';
import { useCustomCursor } from '../hooks/useCustomCursor';
import '../style/auth.css';
import { loginUser } from "../api/auth.js";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_URL } from '../api/config';




const LoginPage = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/homepage" replace />;
  }


  const [sceneManager, setSceneManager] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      console.log("Login submitted:", formData);

      try {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
        });

        console.log("Login response:", res.data);

        // Save token and user ID to localStorage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user.id);

        // Redirect to homepage
        navigate("/homepage", { replace: true });
      } catch (err) {
        console.error("Login error:", err.response?.data || err.message);
        setErrors({ general: err.response?.data.message || "Login failed" });
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
          href="/signup"
          className="auth-nav-link"
          onMouseEnter={enlargeCursor}
          onMouseLeave={resetCursor}
        >
          Sign Up
        </a>
      </nav>

      {/* Login Form Container */}
      <div className="auth-container">
        <div
          className="auth-card"
          onMouseEnter={enlargeCursor}
          onMouseLeave={resetCursor}
        >
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Enter your password"
                onMouseEnter={enlargeCursor}
                onMouseLeave={resetCursor}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="checkbox-input"
                  onMouseEnter={enlargeCursor}
                  onMouseLeave={resetCursor}
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="forgot-link"
                onMouseEnter={enlargeCursor}
                onMouseLeave={resetCursor}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="submit-btn"
              onMouseEnter={enlargeCursor}
              onMouseLeave={resetCursor}
            >
              Sign In
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
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
            Don't have an account?{' '}
            <a
              href="/signup"
              className="auth-link"
              onMouseEnter={enlargeCursor}
              onMouseLeave={resetCursor}
            >
              Sign up
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

export default LoginPage;
