import React, { useState, useCallback, useEffect } from 'react';
import LiquidGradientBackground from './LiquidGradientBackground';
import ColorAdjusterPanel from './ColorAdjusterPanel';
import { useCustomCursor } from '../hooks/useCustomCursor';
import { useScrollEffects } from '../hooks/useScrollEffects';
import '../style/index2.css';

const LandingPage = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sceneManager, setSceneManager] = useState(null);
  const [showLoader, setShowLoader] = useState(true);
  const { cursorRef, enlargeCursor, resetCursor, enlargeCursorLarge } = useCustomCursor();

  useScrollEffects();

  const handleSceneReady = useCallback((manager) => {
    setSceneManager(manager);
  }, []);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showLoader) {
    return (
      <div className="cohort-loader-screen">
        <div className="cohort-loader-wrap">
          <div className="cohort-loader-brand">cohort</div>
          <div className="cohort-loader-bar">
            <span className="cohort-loader-fill"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main" style={{ cursor: 'none' }}>
      {/* Navigation */}
      <nav className="navbar">
        <div className="buttonbox">
          <button
            className="toggle-adjuster-btn"
            onClick={togglePanel}
            onMouseEnter={enlargeCursor}
            onMouseLeave={resetCursor}
          >
            {isPanelOpen ? 'Close' : 'Cohort'}
          </button>
          <button
            className="toggle-adjuster-btn-2"
            onMouseEnter={enlargeCursor}
            onMouseLeave={resetCursor}
            onClick={"/signup"}
          >
            <a href="/signup">Signup</a>
          </button>
          <button
            className="toggle-adjuster-btn-2"
            onMouseEnter={enlargeCursor}
            onMouseLeave={resetCursor}
          >
            <a href="/login">Login</a>
          </button>
        </div>

        <div className="nav-right">
          <a
            href="#"
            onMouseEnter={enlargeCursor}
            onMouseLeave={resetCursor}
          >
            Home
          </a>
          <a
            href="#info-section"
            onMouseEnter={enlargeCursor}
            onMouseLeave={resetCursor}
          >
            About
          </a>
          <a
            href="#"
            onMouseEnter={enlargeCursor}
            onMouseLeave={resetCursor}
          >
            Contact
          </a>
        </div>
      </nav>

      {/* Hero Section - First Page Only */}
      <section className="hero-section">
        {/* Liquid Gradient Background */}
        <LiquidGradientBackground onSceneReady={handleSceneReady} />

        {/* Main Heading */}
        <h1 className="heading">Cohort</h1>

        {/* Footer */}
        <footer className="footer">
          <a
            href="https://madebybeings.com"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={enlargeCursor}
            onMouseLeave={resetCursor}
          >
            Engage, communicate and grow
          </a>
        </footer>
      </section>

      {/* Color Adjuster Panel */}
      <ColorAdjusterPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        sceneManager={sceneManager}
      />

      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor">
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '8px',
            height: '8px',
            background: 'white',
            borderRadius: '50%'
          }}
        />
      </div>

      {/* Information Section */}
      <section className="info-section" id="info-section">
        <div className="info-container">
          <h2 className="info-section-title">More about us</h2>

          <div className="info-grid">
            <div
              className="info-box animate-on-scroll"
              data-delay="0"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="info-content">
                <h3>Community</h3>
                <p>
                  Create topic based communities where members can chat, share
                  updates and stay organized in one place instead of scattered
                  across different platforms.
                </p>
              </div>
            </div>

            <div
              className="info-box animate-on-scroll"
              data-delay="100"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="info-content">
                <h3>Smart Event Hub</h3>
                <p>
                  Plan meetups, classes and online sessions with built-in event
                  pages, RSVP tracking, reminders and calendar integration.
                </p>
              </div>
            </div>

            <div
              className="info-box animate-on-scroll"
              data-delay="200"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="info-content">
                <h3>Real-Time AI Translation</h3>
                <p>
                  Break language barriers with real-time AI-powered translation
                  for all your community interactions.
                </p>
              </div>
            </div>

            <div
              className="info-box animate-on-scroll"
              data-delay="0"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="info-content">
                <h3>Schedule and Auto Message Suggestions</h3>
                <p>
                  Schedule monthly or weekly messages with AI-powered
                  suggestions to keep your community engaged and informed.
                </p>
              </div>
            </div>

            <div
              className="info-box animate-on-scroll"
              data-delay="100"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="info-content">
                <h3>Built-in AI Assistant</h3>
                <p>
                  Ask the AI assistant questions, get instant responses, and
                  receive personalized recommendations to help manage your
                  community more effectively.
                </p>
              </div>
            </div>

            <div
              className="info-box animate-on-scroll"
              data-delay="200"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="info-content">
                <h3>Safety and Moderation</h3>
                <p>
                  Ensure a safe environment with automated moderation tools,
                  content filtering, and user reporting features.
                </p>
              </div>
            </div>
          </div>

          {/* Large Feature Blocks */}
          <div className="feature-blocks">
            <div
              className="feature-block animate-on-scroll"
              data-delay="0"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="feature-content">
                <h2>Featured Content</h2>
                <p>
                  This is a larger content block that can showcase important
                  information, featured projects, or key messages. It has more
                  space for detailed content and stands out from the grid above.
                </p>
              </div>
            </div>

            <div
              className="feature-block animate-on-scroll"
              data-delay="200"
              onMouseEnter={enlargeCursorLarge}
              onMouseLeave={resetCursor}
            >
              <div className="feature-content">
                <h2>Special Highlight</h2>
                <p>
                  Another featured block with plenty of room for content. These
                  blocks have enhanced animations and visual effects to draw
                  attention to your most important information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
