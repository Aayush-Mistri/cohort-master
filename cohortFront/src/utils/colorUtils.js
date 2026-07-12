/**
 * Color utilities for Three.js integration
 */

/**
 * Convert hex color to RGB object (0-1 range for Three.js)
 * @param {string} hex - Hex color string (e.g., '#FF0000')
 * @returns {Object} - RGB values normalized to 0-1 range
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      }
    : null;
};

/**
 * Convert RGB (0-1 range) to hex color
 * @param {number} r - Red value (0-1)
 * @param {number} g - Green value (0-1)
 * @param {number} b - Blue value (0-1)
 * @returns {string} - Hex color string
 */
export const rgbToHex = (r, g, b) => {
  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Convert RGB (0-255 range) to hex color
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} - Hex color string
 */
export const rgb255ToHex = (r, g, b) => {
  const toHex = (value) => {
    const hex = Math.round(value).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generate a random hex color
 * @returns {string} - Random hex color
 */
export const randomHexColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Predefined color schemes
 */
export const colorSchemes = {
  original: {
    color1: '#F15A22',
    color2: '#0a0e27',
    color3: '#F15A22',
    color4: '#0a0e27',
    color5: '#F15A22',
    color6: '#0a0e27'
  },
  sunset: {
    color1: '#FF6B6B',
    color2: '#4ECDC4',
    color3: '#FFE66D',
    color4: '#95E1D3',
    color5: '#F38181',
    color6: '#AA96DA'
  },
  ocean: {
    color1: '#006994',
    color2: '#051622',
    color3: '#0496FF',
    color4: '#1B2845',
    color5: '#00B8D4',
    color6: '#1E3A8A'
  },
  forest: {
    color1: '#2D5016',
    color2: '#111111',
    color3: '#4E9F3D',
    color4: '#1A1A1A',
    color5: '#8BC34A',
    color6: '#263238'
  },
  neon: {
    color1: '#FF006E',
    color2: '#001219',
    color3: '#FB5607',
    color4: '#03071E',
    color5: '#FFBE0B',
    color6: '#0A0F14'
  },
  purple: {
    color1: '#7209B7',
    color2: '#10002B',
    color3: '#B5179E',
    color4: '#240046',
    color5: '#F72585',
    color6: '#3C096C'
  },
  cyber: {
    color1: '#00F5FF',
    color2: '#000814',
    color3: '#FF00FF',
    color4: '#001D3D',
    color5: '#00FFF5',
    color6: '#003566'
  }
};

/**
 * Apply a color scheme to the scene
 * @param {Object} sceneManager - Three.js scene manager
 * @param {Object} scheme - Color scheme object
 */
export const applyColorScheme = (sceneManager, scheme) => {
  if (!sceneManager?.background) return;
  
  Object.entries(scheme).forEach(([key, value]) => {
    const colorIndex = key.replace('color', '');
    sceneManager.background.updateColor(colorIndex, value);
  });
};

/**
 * Get complementary color
 * @param {string} hex - Hex color string
 * @returns {string} - Complementary hex color
 */
export const getComplementaryColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(1 - rgb.r, 1 - rgb.g, 1 - rgb.b);
};

/**
 * Lighten/darken a color
 * @param {string} hex - Hex color string
 * @param {number} percent - Percentage to lighten (positive) or darken (negative)
 * @returns {string} - Modified hex color
 */
export const adjustBrightness = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const adjust = (value) => {
    const adjusted = value + (percent / 100);
    return Math.max(0, Math.min(1, adjusted));
  };
  
  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
};

/**
 * Check if color is dark or light
 * @param {string} hex - Hex color string
 * @returns {boolean} - True if dark, false if light
 */
export const isDarkColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  // Calculate luminance
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance < 0.5;
};

/**
 * Generate gradient color scheme
 * @param {string} startColor - Starting hex color
 * @param {string} endColor - Ending hex color
 * @param {number} steps - Number of colors to generate
 * @returns {Array} - Array of hex colors
 */
export const generateGradient = (startColor, endColor, steps = 6) => {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  
  if (!start || !end) return [];
  
  const colors = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = start.r + (end.r - start.r) * ratio;
    const g = start.g + (end.g - start.g) * ratio;
    const b = start.b + (end.b - start.b) * ratio;
    colors.push(rgbToHex(r, g, b));
  }
  
  return colors;
};

export default {
  hexToRgb,
  rgbToHex,
  rgb255ToHex,
  randomHexColor,
  colorSchemes,
  applyColorScheme,
  getComplementaryColor,
  adjustBrightness,
  isDarkColor,
  generateGradient
};
