# Quick Start Guide

Get your React landing page up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install three
```

## Step 2: File Setup

Copy these files to your React project:

```
your-react-app/
├── src/
│   ├── components/
│   │   ├── LiquidGradientBackground.jsx
│   │   ├── ColorAdjusterPanel.jsx
│   │   └── LandingPage.jsx
│   ├── hooks/
│   │   ├── useCustomCursor.js
│   │   └── useScrollEffects.js
│   ├── utils/
│   │   └── colorUtils.js
│   └── styles/
│       └── index2.css
```

## Step 3: Update Your App.js

```jsx
// src/App.js
import React from 'react';
import LandingPage from './components/LandingPage';
import './styles/index2.css';

function App() {
  return <LandingPage />;
}

export default App;
```

## Step 4: Test It Out

```bash
npm start
```

That's it! Your landing page should now be running.

---

## Common Use Cases

### 1. Just Want the Animated Background?

```jsx
import LiquidGradientBackground from './components/LiquidGradientBackground';

function MyPage() {
  return (
    <div>
      <LiquidGradientBackground />
      <h1>Your Content Here</h1>
    </div>
  );
}
```

### 2. Want Custom Colors?

```jsx
import { useState } from 'react';
import LiquidGradientBackground from './components/LiquidGradientBackground';
import { applyColorScheme, colorSchemes } from './utils/colorUtils';

function MyPage() {
  const [scene, setScene] = useState(null);

  const handleChangeScheme = () => {
    applyColorScheme(scene, colorSchemes.sunset);
  };

  return (
    <>
      <LiquidGradientBackground onSceneReady={setScene} />
      <button onClick={handleChangeScheme}>
        Change to Sunset Theme
      </button>
    </>
  );
}
```

### 3. Just Need the Custom Cursor?

```jsx
import { useCustomCursor } from './hooks/useCustomCursor';

function MyPage() {
  const { cursorRef, enlargeCursor, resetCursor } = useCustomCursor();

  return (
    <div style={{ cursor: 'none' }}>
      <button
        onMouseEnter={enlargeCursor}
        onMouseLeave={resetCursor}
      >
        Hover Me!
      </button>
      
      <div ref={cursorRef} className="custom-cursor">
        <div className="custom-cursor-dot" />
      </div>
    </div>
  );
}
```

### 4. Want Scroll Animations Only?

```jsx
import { useScrollAnimation } from './hooks/useScrollEffects';

function MyPage() {
  useScrollAnimation();

  return (
    <div>
      <div className="animate-on-scroll" data-delay="0">
        This fades in when scrolled into view
      </div>
      
      <div className="animate-on-scroll" data-delay="200">
        This fades in 200ms later
      </div>
    </div>
  );
}
```

---

## Available Color Schemes

Try different pre-built color schemes:

```jsx
import { colorSchemes, applyColorScheme } from './utils/colorUtils';

// Available schemes:
// - colorSchemes.original
// - colorSchemes.sunset
// - colorSchemes.ocean
// - colorSchemes.forest
// - colorSchemes.neon
// - colorSchemes.purple
// - colorSchemes.cyber

applyColorScheme(sceneManager, colorSchemes.ocean);
```

---

## Troubleshooting

### Problem: "THREE is not defined"

**Solution:**
```bash
npm install three
```

### Problem: Cursor not showing

**Solution:** Add to your CSS:
```css
body {
  cursor: none;
}
```

### Problem: Background not showing

**Solution:** Check that the container has proper positioning:
```css
.main {
  position: relative;
  min-height: 100vh;
}
```

### Problem: Animations not triggering

**Solution:** Ensure elements have the correct class:
```jsx
<div className="animate-on-scroll" data-delay="100">
  Content
</div>
```

---

## Performance Tips

1. **Lazy load the background on mobile:**
```jsx
const isMobile = window.innerWidth < 768;

{!isMobile && <LiquidGradientBackground />}
```

2. **Reduce animation quality on slower devices:**
```jsx
// In LiquidGradientBackground.jsx, adjust:
this.renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
```

3. **Disable custom cursor on touch devices:**
```jsx
const isTouchDevice = 'ontouchstart' in window;
{!isTouchDevice && <CustomCursor />}
```

---

## What's Next?

- Check out `README.md` for detailed documentation
- Explore `colorUtils.js` for more color manipulation functions
- Customize the shader code in `LiquidGradientBackground.jsx`
- Add your own color schemes
- Integrate with your routing system (React Router, Next.js, etc.)

---

## Need Help?

- Check the full `README.md` file
- Review the comments in each component
- Look at the original `script.js` for reference
- All the logic is preserved, just React-ified!

Happy coding! 🚀
