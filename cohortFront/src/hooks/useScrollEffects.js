import { useEffect, useRef } from 'react';

/**
 * Custom hook for scroll animations using Intersection Observer
 * @param {Object} options - Intersection Observer options
 * @returns {Object} - Returns ref to attach to animated elements
 */
export const useScrollAnimation = (options = {}) => {
  const defaultOptions = {
    threshold: 0.05,
    rootMargin: '0px 0px -30px 0px',
    ...options
  };

  useEffect(() => {
    let observer;

    const revealElement = (el) => {
      const delay = el.dataset.delay || 0;
      setTimeout(() => {
        el.classList.add('visible');
      }, parseInt(delay));
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    };

    observer = new IntersectionObserver(observerCallback, defaultOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    // Safety fallback: after 3s reveal anything still invisible
    const fallbackTimer = setTimeout(() => {
      document.querySelectorAll('.animate-on-scroll:not(.visible)').forEach((el) => {
        revealElement(el);
      });
    }, 3000);

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
      clearTimeout(fallbackTimer);
    };
  }, []);
};

/**
 * Custom hook for parallax scroll effect
 */
export const useParallaxScroll = () => {
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset || window.scrollY;
          const infoBoxes = document.querySelectorAll('.info-box, .feature-block');

          infoBoxes.forEach((box) => {
            const rect = box.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (isVisible) {
              const scrollProgress = (window.innerHeight - rect.top) / window.innerHeight;
              const translateY = Math.min(scrollProgress * 20, 20);
              box.style.transform = `translateY(-${translateY}px)`;
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};

/**
 * Custom hook for smooth scroll navigation
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
};

/**
 * Combined hook for all scroll-related functionality
 */
export const useScrollEffects = (options) => {
  useScrollAnimation(options);
  useParallaxScroll();
  useSmoothScroll();
};

export default useScrollEffects;
