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
