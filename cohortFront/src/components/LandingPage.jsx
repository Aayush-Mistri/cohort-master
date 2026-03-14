import React, { useState, useCallback, useEffect } from 'react';
import LiquidGradientBackground from './LiquidGradientBackground';
import ColorAdjusterPanel from './ColorAdjusterPanel';
import { useCustomCursor } from '../hooks/useCustomCursor';
import { useScrollEffects } from '../hooks/useScrollEffects';
import '../style/index2.css';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Community Spaces',
    desc: 'Create topic-based communities where members chat, share updates and stay organized — no more scattered platforms.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Smart Event Hub',
    desc: 'Plan meetups, classes and sessions with RSVP tracking, reminders and calendar sync — all in one place.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'AI Translation',
    desc: 'Break language barriers with real-time AI translation flowing across every group interaction seamlessly.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Scheduled Messaging',
    desc: 'Queue messages for any time — daily, weekly or custom — with AI suggestions to keep engagement high.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Built-in AI Assistant',
    desc: 'Ask questions, get smart summaries and receive personalized tips to run your community more effectively.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Safety & Moderation',
    desc: 'Automated moderation tools, content filtering and one-click reporting keep your space safe by default.',
  },
];

const STATS = [
  { value: '10x', label: 'Faster setup' },
  { value: 'AI', label: 'Powered tools' },
  { value: '∞', label: 'Scalable size' },
  { value: '24/7', label: 'Always safe' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your space', desc: 'Start a community or group chat and invite members with a single shareable link.' },
  { step: '02', title: 'Schedule & automate', desc: 'Queue announcements, reminders and recurring messages without ever going manual.' },
  { step: '03', title: 'Engage & grow', desc: 'Use reactions, AI insights and event tools to keep momentum building every day.' },
];

const LandingPage = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sceneManager, setSceneManager] = useState(null);
  const [showLoader, setShowLoader] = useState(true);
  const { cursorRef, enlargeCursor, resetCursor, enlargeCursorLarge } = useCustomCursor();

  useScrollEffects();

  const handleSceneReady = useCallback((manager) => {
    setSceneManager(manager);
  }, []);

  const togglePanel = () => setIsPanelOpen(!isPanelOpen);

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

      {/* ── Navigation ── */}
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
          <a className="toggle-adjuster-btn-2" href="/signup" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>
            Signup
          </a>
          <a className="toggle-adjuster-btn-2" href="/login" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>
            Login
          </a>
        </div>
        <div className="nav-right">
          <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Home</a>
          <a href="#about" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>About</a>
          <a href="#contact" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Contact</a>
        </div>
      </nav>

      {/* ── Hero Section (untouched) ── */}
      <section className="hero-section">
        <LiquidGradientBackground onSceneReady={handleSceneReady} />
        <h1 className="heading">Cohort</h1>
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

      {/* ── Color Adjuster Panel ── */}
      <ColorAdjusterPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        sceneManager={sceneManager}
      />

      {/* ── Custom Cursor ── */}
      <div ref={cursorRef} className="custom-cursor">
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'8px', height:'8px', background:'white', borderRadius:'50%' }} />
      </div>

      {/* ════════════════════════════════
          CONTENT BELOW HERO
      ════════════════════════════════ */}
      <div className="page-body">

        {/* ── Features Section ── */}
        <section className="lp-section" id="about">
          <div className="lp-container">
            <div className="lp-pill animate-on-scroll" data-delay="0">What we offer</div>
            <h2 className="lp-heading animate-on-scroll" data-delay="80">
              Everything your community<br />
              <span className="lp-heading--accent">needs, in one place</span>
            </h2>
            <p className="lp-subtext animate-on-scroll" data-delay="140">
              Cohort is built for groups that take communication seriously — from real‑time chat
              to AI‑powered scheduling, every tool drives clarity and momentum.
            </p>

            <div className="feat-grid">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="feat-card animate-on-scroll"
                  data-delay={`${i * 70}`}
                  onMouseEnter={enlargeCursorLarge}
                  onMouseLeave={resetCursor}
                >
                  <div className="feat-icon">{f.icon}</div>
                  <h3 className="feat-title">{f.title}</h3>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats Band ── */}
        <div className="stats-band">
          <div className="lp-container">
            <div className="stats-band__inner">
              {STATS.map((s, i) => (
                <div key={s.label} className="stat animate-on-scroll" data-delay={`${i * 80}`}>
                  <span className="stat__value">{s.value}</span>
                  <span className="stat__label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How It Works ── */}
        <section className="lp-section lp-section--alt">
          <div className="lp-container">
            <div className="lp-pill animate-on-scroll" data-delay="0">Process</div>
            <h2 className="lp-heading animate-on-scroll" data-delay="80">How it works</h2>
            <p className="lp-subtext animate-on-scroll" data-delay="140">
              Set up your cohort in minutes, then let automation and AI do the heavy lifting.
            </p>

            <div className="steps-row">
              {HOW_IT_WORKS.map((h, i) => (
                <div
                  key={h.step}
                  className="step-card animate-on-scroll"
                  data-delay={`${i * 110}`}
                  onMouseEnter={enlargeCursorLarge}
                  onMouseLeave={resetCursor}
                >
                  <span className="step-num">{h.step}</span>
                  <h3 className="step-title">{h.title}</h3>
                  <p className="step-desc">{h.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && <div className="step-arrow">→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Cohort ── */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-pill animate-on-scroll" data-delay="0">Why Cohort</div>
            <h2 className="lp-heading animate-on-scroll" data-delay="80">Built different,<br /> by design</h2>

            <div className="why-grid">
              {[
                { icon: '🔒', title: 'Secured by default', desc: 'End-to-end ready encryption across all messages and community channels.' },
                { icon: '⚡', title: 'Instant delivery', desc: 'Real-time + scheduled messages so nothing is ever missed or delayed.' },
                { icon: '📈', title: 'Built to scale', desc: 'Tools that grow with your group — from 10 members to 10,000 and beyond.' },
                { icon: '🎯', title: 'Zero distractions', desc: 'A focused interface that keeps your community in flow, not overwhelmed.' },
              ].map((w, i) => (
                <div
                  key={w.title}
                  className="why-card animate-on-scroll"
                  data-delay={`${i * 80}`}
                  onMouseEnter={enlargeCursorLarge}
                  onMouseLeave={resetCursor}
                >
                  <span className="why-icon">{w.icon}</span>
                  <h4 className="why-title">{w.title}</h4>
                  <p className="why-desc">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="lp-section lp-section--cta">
          <div className="lp-container">
            <div className="cta-box animate-on-scroll" data-delay="0">
              <div className="cta-box__glow" />
              <span className="lp-pill" style={{ marginBottom: '1.5rem' }}>Get started — it's free</span>
              <h2 className="cta-box__heading">Ready to build your community?</h2>
              <p className="cta-box__sub">
                Launch your cohort with messaging, AI scheduling, and community tools — all in one place.
              </p>
              <div className="cta-box__actions">
                <a href="/signup" className="btn-primary" onMouseEnter={enlargeCursorLarge} onMouseLeave={resetCursor}>
                  Start for free →
                </a>
                <a href="/login" className="btn-ghost" onMouseEnter={enlargeCursorLarge} onMouseLeave={resetCursor}>
                  Log in
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="site-footer" id="contact">
          <div className="lp-container">
            <div className="footer-grid">
              {/* Brand */}
              <div className="footer-brand">
                <span className="footer-logo">cohort</span>
                <p className="footer-tagline">Engage, communicate, and grow communities with clarity and intelligence.</p>
                <div className="footer-socials">
                  <a href="#" aria-label="Twitter" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43 1s-2 .9-3.3 1.15A4.52 4.52 0 0 0 11.5 6c0 .35.04.7.11 1.03A12.8 12.8 0 0 1 1.64 2.16s-4 9 5 13A13 13 0 0 1 0 17c0 4 4.5 6 9 6 8 0 14-5.3 14-12 0-.18 0-.35-.02-.52A10 10 0 0 0 23 3z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="GitHub" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="LinkedIn" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Links */}
              <div className="footer-col">
                <span className="footer-col__head">Product</span>
                <a href="#about" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>About</a>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Features</a>
                <a href="/signup" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Get started</a>
              </div>
              <div className="footer-col">
                <span className="footer-col__head">Company</span>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Careers</a>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Press</a>
                <a href="#contact" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Contact</a>
              </div>
              <div className="footer-col">
                <span className="footer-col__head">Resources</span>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Docs</a>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Security</a>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Support</a>
              </div>
            </div>

            <div className="footer-bottom">
              <span>© 2026 Cohort. All rights reserved.</span>
              <div className="footer-bottom__links">
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Privacy</a>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Terms</a>
                <a href="#" onMouseEnter={enlargeCursor} onMouseLeave={resetCursor}>Cookies</a>
              </div>
            </div>
          </div>
        </footer>

      </div>{/* /page-body */}
    </div>
  );
};

export default LandingPage;
