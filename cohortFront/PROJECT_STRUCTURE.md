# 📁 Complete Project Structure Guide

## Standard React Project Structure

```
your-react-app/
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── LandingPage.jsx     # ← Main landing page component
│   │   ├── LiquidGradientBackground.jsx  # ← Three.js background
│   │   └── ColorAdjusterPanel.jsx        # ← Color picker panel
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useCustomCursor.js  # ← Custom cursor logic
│   │   └── useScrollEffects.js # ← Scroll animations
│   │
│   ├── utils/                   # Helper functions
│   │   └── colorUtils.js       # ← Color manipulation utilities
│   │
│   ├── styles/                  # CSS files
│   │   └── index2.css          # ← Your existing CSS
│   │
│   ├── App.js                   # Main App component (modify this)
│   ├── index.js                 # Entry point
│   └── App.css                  # App styles (optional)
│
├── package.json                 # Dependencies
├── README.md                    # Project documentation
└── QUICKSTART.md               # Quick start guide
```

---

## 🎯 Step-by-Step File Placement

### Step 1: Create the Folder Structure

If folders don't exist, create them:

```bash
cd your-react-app/src
mkdir -p components hooks utils styles
```

### Step 2: Place Your Files

**Components** (`src/components/`):
```
src/components/
├── LandingPage.jsx
├── LiquidGradientBackground.jsx
└── ColorAdjusterPanel.jsx
```

**Hooks** (`src/hooks/`):
```
src/hooks/
├── useCustomCursor.js
└── useScrollEffects.js
```

**Utils** (`src/utils/`):
```
src/utils/
└── colorUtils.js
```

**Styles** (`src/styles/`):
```
src/styles/
└── index2.css    # Your existing CSS file
```

**Documentation** (root directory):
```
your-react-app/
├── README.md
└── QUICKSTART.md
```

---

## 🔧 Modify Existing Files

### 1. Update `src/App.js`

Replace the content with:

```jsx
import React from 'react';
import LandingPage from './components/LandingPage';
import './styles/index2.css';

function App() {
  return <LandingPage />;
}

export default App;
```

### 2. Update `src/index.js` (if needed)

Make sure it looks like this:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Optional: global styles
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 3. Update `package.json`

Add Three.js dependency:

```bash
npm install three
```

Or manually add to `package.json`:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.150.0"
  }
}
```

---

## 📋 Complete File Tree

After setup, your project should look like this:

```
your-react-app/
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   │
│   ├── components/
│   │   ├── LandingPage.jsx                    # Main page component
│   │   ├── LiquidGradientBackground.jsx       # Three.js animated background
│   │   └── ColorAdjusterPanel.jsx             # Color picker UI
│   │
│   ├── hooks/
│   │   ├── useCustomCursor.js                 # Custom cursor functionality
│   │   └── useScrollEffects.js                # Scroll animations
│   │
│   ├── utils/
│   │   └── colorUtils.js                      # Color helpers
│   │
│   ├── styles/
│   │   └── index2.css                         # Your existing CSS
│   │
│   ├── App.js                                 # ← MODIFY THIS
│   ├── App.css                                # Optional
│   ├── index.js                               # Entry point
│   └── index.css                              # Global styles
│
├── node_modules/                              # Auto-generated
├── package.json                               # Dependencies
├── package-lock.json                          # Auto-generated
├── README.md                                  # Documentation
├── QUICKSTART.md                              # Quick guide
└── .gitignore
```

---

## 🎨 Alternative Structure (If Using Pages)

Some projects use a `pages` folder:

```
src/
├── pages/
│   └── LandingPage.jsx          # Move here instead of components/
│
├── components/
│   ├── LiquidGradientBackground.jsx
│   └── ColorAdjusterPanel.jsx
│
├── hooks/
│   ├── useCustomCursor.js
│   └── useScrollEffects.js
│
├── utils/
│   └── colorUtils.js
│
└── styles/
    └── index2.css
```

Then update `App.js`:

```jsx
import LandingPage from './pages/LandingPage';
```

---

## 🚀 Next.js Project Structure

If you're using Next.js:

```
your-nextjs-app/
├── app/                         # Next.js 13+ App Router
│   ├── page.js                  # Home page (use LandingPage here)
│   └── layout.js
│
├── components/
│   ├── LiquidGradientBackground.jsx
│   └── ColorAdjusterPanel.jsx
│
├── hooks/
│   ├── useCustomCursor.js
│   └── useScrollEffects.js
│
├── utils/
│   └── colorUtils.js
│
├── styles/
│   └── index2.css
│
└── public/
    └── (static files)
```

For Next.js, add `'use client'` at the top of components that use hooks:

```jsx
'use client';

import React, { useState } from 'react';
// ... rest of your component
```

---

## 📦 Create React App (CRA) - Default Structure

If you used `npx create-react-app`:

```
my-app/
├── node_modules/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── components/              # CREATE THIS
│   │   ├── LandingPage.jsx
│   │   ├── LiquidGradientBackground.jsx
│   │   └── ColorAdjusterPanel.jsx
│   │
│   ├── hooks/                   # CREATE THIS
│   │   ├── useCustomCursor.js
│   │   └── useScrollEffects.js
│   │
│   ├── utils/                   # CREATE THIS
│   │   └── colorUtils.js
│   │
│   ├── styles/                  # CREATE THIS
│   │   └── index2.css
│   │
│   ├── App.js                   # MODIFY THIS
│   ├── App.css
│   ├── App.test.js
│   ├── index.js
│   ├── index.css
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
│
├── .gitignore
├── package.json
├── README.md                    # REPLACE THIS
├── QUICKSTART.md               # ADD THIS
└── yarn.lock
```

---

## 🔍 How to Verify Your Setup

Run these commands to verify structure:

```bash
# Check if folders exist
ls src/components
ls src/hooks
ls src/utils
ls src/styles

# Check if files are in place
ls src/components/LandingPage.jsx
ls src/hooks/useCustomCursor.js
ls src/styles/index2.css
```

---

## ⚡ Quick Setup Commands

Copy and paste these commands:

```bash
# Navigate to your React app
cd your-react-app

# Create folder structure
mkdir -p src/components src/hooks src/utils src/styles

# Install Three.js
npm install three

# Now copy your files into the respective folders
# Then modify src/App.js

# Start the app
npm start
```

---

## 🎯 Import Path Reference

Based on the structure above, here are the correct import paths:

### In `src/App.js`:
```jsx
import LandingPage from './components/LandingPage';
import './styles/index2.css';
```

### In `src/components/LandingPage.jsx`:
```jsx
import LiquidGradientBackground from './LiquidGradientBackground';
import ColorAdjusterPanel from './ColorAdjusterPanel';
import { CustomCursor, useCustomCursor } from '../hooks/useCustomCursor';
import { useScrollEffects } from '../hooks/useScrollEffects';
import '../styles/index2.css';
```

### In `src/components/ColorAdjusterPanel.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
// No additional imports needed
```

### In `src/components/LiquidGradientBackground.jsx`:
```jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
```

### In `src/hooks/useCustomCursor.js`:
```jsx
import { useEffect, useRef, useState } from 'react';
```

### In `src/hooks/useScrollEffects.js`:
```jsx
import { useEffect, useRef } from 'react';
```

---

## ✅ Final Checklist

- [ ] All folders created (`components`, `hooks`, `utils`, `styles`)
- [ ] All `.jsx` files in `src/components/`
- [ ] All `.js` hooks in `src/hooks/`
- [ ] `colorUtils.js` in `src/utils/`
- [ ] `index2.css` in `src/styles/`
- [ ] `App.js` updated with correct imports
- [ ] Three.js installed (`npm install three`)
- [ ] `npm start` runs without errors

---

## 🆘 Common Issues

### Issue: "Module not found"

**Solution:** Check your import paths match the folder structure.

```jsx
// ✅ Correct
import LandingPage from './components/LandingPage';

// ❌ Wrong
import LandingPage from './LandingPage';
```

### Issue: "Cannot find module 'three'"

**Solution:**
```bash
npm install three
```

### Issue: CSS not loading

**Solution:** Make sure to import in `App.js`:
```jsx
import './styles/index2.css';
```

---

## 📝 Summary

1. Create folders: `components`, `hooks`, `utils`, `styles`
2. Place files in respective folders
3. Update `App.js` to import `LandingPage`
4. Install Three.js: `npm install three`
5. Run: `npm start`

That's it! Your React landing page is ready to go! 🚀
