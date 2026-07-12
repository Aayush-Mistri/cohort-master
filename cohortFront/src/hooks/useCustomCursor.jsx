import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for animated cursor functionality
 * @returns {Object} - Returns cursor ref and utility functions
 */
export const useCustomCursor = () => {
  const cursorRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        animateCursor();
      }
    };

    const animateCursor = () => {
      if (!isAnimatingRef.current) return;
      if (!cursorRef.current) {
        isAnimatingRef.current = false;
        return;
      }

      // Instant following
      cursorPositionRef.current = { ...mousePositionRef.current };

      if (cursorRef.current) {
        cursorRef.current.style.left = `${cursorPositionRef.current.x}px`;
        cursorRef.current.style.top = `${cursorPositionRef.current.y}px`;
      }

      animationFrameRef.current = requestAnimationFrame(animateCursor);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Pulse effect on mouse move
  useEffect(() => {
    let lastMouseMoveTime = 0;
    let pulseFrame = null;

    const checkPulse = () => {
      if (Date.now() - lastMouseMoveTime > 100) {
        if (cursorRef.current) {
          cursorRef.current.style.borderWidth = '2px';
        }
        pulseFrame = null;
      } else {
        pulseFrame = requestAnimationFrame(checkPulse);
      }
    };

    const handleMouseMove = () => {
      lastMouseMoveTime = Date.now();
      if (cursorRef.current) {
        cursorRef.current.style.borderWidth = '2.5px';
      }
      if (!pulseFrame) {
        pulseFrame = requestAnimationFrame(checkPulse);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (pulseFrame) {
        cancelAnimationFrame(pulseFrame);
      }
    };
  }, []);

  const enlargeCursor = () => {
    if (cursorRef.current) {
      cursorRef.current.style.width = '50px';
      cursorRef.current.style.height = '50px';
      cursorRef.current.style.borderWidth = '3px';
    }
  };

  const resetCursor = () => {
    if (cursorRef.current) {
      cursorRef.current.style.width = '40px';
      cursorRef.current.style.height = '40px';
      cursorRef.current.style.borderWidth = '2px';
    }
  };

  const enlargeCursorLarge = () => {
    if (cursorRef.current) {
      cursorRef.current.style.width = '60px';
      cursorRef.current.style.height = '60px';
      cursorRef.current.style.borderWidth = '3px';
    }
  };

  return {
    cursorRef,
    enlargeCursor,
    resetCursor,
    enlargeCursorLarge
  };
};

export default useCustomCursor;
