import React, { useState, useEffect } from 'react';

const ColorAdjusterPanel = ({ isOpen, onClose, sceneManager }) => {
  const [colors, setColors] = useState({
    color1: '#F15A22',
    color2: '#0a0e27',
    color3: '#F15A22',
    color4: '#0a0e27',
    color5: '#F15A22',
    color6: '#0a0e27'
  });

  const [copiedStates, setCopiedStates] = useState({});

  // Update scene colors when colors change
  useEffect(() => {
    if (sceneManager?.background) {
      Object.keys(colors).forEach((key) => {
        const colorIndex = key.replace('color', '');
        sceneManager.background.updateColor(colorIndex, colors[key]);
      });
    }
  }, [colors, sceneManager]);

  const handleColorChange = (colorKey, value) => {
    setColors((prev) => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const handleCopy = async (colorKey) => {
    try {
      await navigator.clipboard.writeText(colors[colorKey]);
      setCopiedStates((prev) => ({ ...prev, [colorKey]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [colorKey]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExportAll = async () => {
    const colorArray = Object.entries(colors).map(([key, value], index) => 
      `Color ${index + 1}: ${value}`
    );
    
    const exportText = `Color Scheme:\n${colorArray.join('\n')}\n\nHex Array: [${Object.values(colors).map(c => `"${c}"`).join(', ')}]`;

    try {
      await navigator.clipboard.writeText(exportText);
      // You could add a temporary success state here if needed
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`color-adjuster-panel ${isOpen ? 'open' : ''}`}>
      <div className="color-adjuster-header">
        <h3 className="color-adjuster-title">Color Adjuster</h3>
        <button className="color-adjuster-close" onClick={onClose}>
          ×
        </button>
      </div>

      {Object.keys(colors).map((colorKey, index) => (
        <div key={colorKey} className="color-picker-group">
          <div className="color-picker-label">
            <span>Color {index + 1}</span>
          </div>
          <div className="color-picker-wrapper">
            <input
              type="color"
              className="color-picker-input"
              value={colors[colorKey]}
              onChange={(e) => handleColorChange(colorKey, e.target.value)}
            />
            <input
              type="text"
              className="color-value-display"
              value={colors[colorKey]}
              readOnly
            />
            <button
              className={`copy-btn ${copiedStates[colorKey] ? 'copied' : ''}`}
              onClick={() => handleCopy(colorKey)}
            >
              {copiedStates[colorKey] ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      ))}

      <div className="color-adjuster-actions">
        <button className="export-btn" onClick={handleExportAll}>
          Export All Colors
        </button>
      </div>
    </div>
  );
};

export default ColorAdjusterPanel;
