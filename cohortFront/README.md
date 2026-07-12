# React Liquid Gradient Landing Page

This is a React conversion of your vanilla JavaScript landing page with Three.js animated liquid gradient background.

## 📁 File Structure

```
src/
├── components/
│   ├── LiquidGradientBackground.jsx  # Main Three.js background component
│   ├── ColorAdjusterPanel.jsx        # Color picker panel component
│   ├── LandingPage.jsx               # Main page component
│   ├── useCustomCursor.js            # Custom cursor hook
│   └── useScrollEffects.js           # Scroll animation hooks
└── styles/
    └── index2.css                     # Your existing CSS (import as-is)
```

## 🚀 Installation

1. **Install Dependencies:**

```bash
npm install three
# or
yarn add three
```

2. **Copy Files to Your React Project:**

Place all the provided files in your React project:
- `LiquidGradientBackground.jsx` → `src/components/`
- `ColorAdjusterPanel.jsx` → `src/components/`
- `LandingPage.jsx` → `src/components/` or `src/pages/`
- `useCustomCursor.js` → `src/hooks/`
- `useScrollEffects.js` → `src/hooks/`
- `index2.css` → `src/styles/` (your existing CSS)

3. **Import in Your App:**

```jsx
// App.js or App.jsx
import React from 'react';
import LandingPage from './components/LandingPage';
import './styles/index2.css';

function App() {
  return <LandingPage />;
}

export default App;
```

## 📋 Key Changes from Vanilla JS

### 1. **Scene Management**
- Converted to class-based approach with refs
- Cleanup handled in `useEffect` return function
- No global variables - everything scoped properly

### 2. **Event Listeners**
- All DOM event listeners properly added/removed in hooks
- Uses React refs instead of `document.getElementById`
- Cleanup functions prevent memory leaks

### 3. **Color Management**
- State managed with `useState`
- Colors automatically update Three.js uniforms via `useEffect`
- No direct DOM manipulation

### 4. **Custom Cursor**
- Implemented as a custom hook (`useCustomCursor`)
- Cursor ref attached to component
- All animations handled via `requestAnimationFrame`

### 5. **Scroll Animations**
- Intersection Observer wrapped in custom hook
- Parallax effects handled in separate hook
- Smooth scroll navigation hook

## 🎨 Component API

### LiquidGradientBackground

```jsx
<LiquidGradientBackground onSceneReady={handleSceneReady} />
```

**Props:**
- `onSceneReady(sceneManager)` - Callback when Three.js scene is initialized

### ColorAdjusterPanel

```jsx
<ColorAdjusterPanel 
  isOpen={isPanelOpen}
  onClose={() => setIsPanelOpen(false)}
  sceneManager={sceneManager}
/>
```

**Props:**
- `isOpen` - Boolean to control panel visibility
- `onClose` - Callback to close panel
- `sceneManager` - Reference to Three.js scene manager

## 🎯 Usage Examples

### Basic Usage

```jsx
import LandingPage from './components/LandingPage';

function App() {
  return <LandingPage />;
}
```

### Custom Implementation

```jsx
import { useState } from 'react';
import LiquidGradientBackground from './components/LiquidGradientBackground';
import { useCustomCursor } from './hooks/useCustomCursor';

function MyPage() {
  const [sceneManager, setSceneManager] = useState(null);
  const { cursorRef, enlargeCursor, resetCursor } = useCustomCursor();

  return (
    <div style={{ cursor: 'none' }}>
      <LiquidGradientBackground onSceneReady={setSceneManager} />
      
      <h1>My Content</h1>
      
      <button
        onMouseEnter={enlargeCursor}
        onMouseLeave={resetCursor}
      >
        Hover Me
      </button>

      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />
    </div>
  );
}
```

### Using Individual Hooks

```jsx
// Scroll animations only
import { useScrollAnimation } from './hooks/useScrollEffects';

function MyComponent() {
  useScrollAnimation({ threshold: 0.2 });
  
  return (
    <div className="animate-on-scroll" data-delay="100">
      Content
    </div>
  );
}

// Custom cursor only
import { useCustomCursor } from './hooks/useCustomCursor';

function MyComponent() {
  const { cursorRef, enlargeCursor, resetCursor } = useCustomCursor();
  
  return (
    <>
      <button 
        onMouseEnter={enlargeCursor}
        onMouseLeave={resetCursor}
      >
        Click me
      </button>
      <div ref={cursorRef} className="custom-cursor" />
    </>
  );
}
```

## ⚙️ Customization

### Change Gradient Colors

```jsx
// In your component
useEffect(() => {
  if (sceneManager?.background) {
    // Update color 1 to red
    sceneManager.background.updateColor(1, '#FF0000');
    
    // Update color 2 to blue
    sceneManager.background.updateColor(2, '#0000FF');
  }
}, [sceneManager]);
```

### Adjust Animation Speed

```jsx
// Modify uniforms in LiquidGradientBackground.jsx
this.uniforms = {
  // ...
  uSpeed: { value: 2.0 }, // Faster (default: 1.2)
  uIntensity: { value: 2.5 }, // More intense (default: 1.8)
  // ...
};
```

### Custom Cursor Size

```jsx
// In useCustomCursor.js
const enlargeCursor = () => {
  if (cursorRef.current) {
    cursorRef.current.style.width = '70px';  // Larger
    cursorRef.current.style.height = '70px';
    cursorRef.current.style.borderWidth = '4px';
  }
};
```

## 🐛 Troubleshooting

### Issue: Three.js scene not rendering

**Solution:** Ensure Three.js is installed and imported:
```bash
npm install three
```

### Issue: Cursor not showing

**Solution:** Make sure CSS is imported and body has `cursor: none`:
```css
body {
  cursor: none;
}
```

### Issue: Colors not updating

**Solution:** Ensure sceneManager is passed correctly:
```jsx
const [sceneManager, setSceneManager] = useState(null);

<LiquidGradientBackground onSceneReady={setSceneManager} />
<ColorAdjusterPanel sceneManager={sceneManager} />
```

### Issue: Scroll animations not working

**Solution:** Ensure elements have the correct classes:
```jsx
<div className="animate-on-scroll" data-delay="100">
  Content
</div>
```

## 🔧 Performance Optimization

1. **Use React.memo for static components:**
```jsx
export default React.memo(ColorAdjusterPanel);
```

2. **Debounce color changes:**
```jsx
import { debounce } from 'lodash';

const debouncedColorChange = debounce((color) => {
  sceneManager.background.updateColor(1, color);
}, 100);
```

3. **Lazy load Three.js:**
```jsx
const LiquidGradientBackground = lazy(() => 
  import('./components/LiquidGradientBackground')
);
```

## 📱 Responsive Design

The CSS already handles responsiveness. For additional mobile optimizations:

```jsx
// Disable custom cursor on touch devices
useEffect(() => {
  const isTouchDevice = 'ontouchstart' in window;
  if (isTouchDevice && cursorRef.current) {
    cursorRef.current.style.display = 'none';
  }
}, []);
```

## 🎓 Key React Concepts Used

- ✅ Custom Hooks
- ✅ useEffect for lifecycle management
- ✅ useRef for DOM references
- ✅ useState for state management
- ✅ Proper cleanup in useEffect
- ✅ Component composition
- ✅ Props and callbacks

## 📝 Notes

- All DOM manipulations are now React-compliant
- Memory leaks prevented with proper cleanup
- Event listeners properly attached/removed
- State management follows React patterns
- No jQuery or global variables
- TypeScript-ready (add types as needed)

## 🚀 Next Steps

1. Add TypeScript types if needed
2. Implement error boundaries
3. Add loading states
4. Optimize with React.memo
5. Add unit tests with Jest/RTL
6. Consider adding Suspense for code splitting

## 📄 License

Same as your original project.
