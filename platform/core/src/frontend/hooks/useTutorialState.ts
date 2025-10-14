/**
 * Tutorial State Hook
 *
 * Manages the "has seen" tutorial flag in localStorage.
 * Spec: 013-tutorial-popup-3
 */

import { useState, useEffect } from 'react';

export function useTutorialState() {
  const [hasSeen, setHasSeen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('tutorial_seen') === 'true';
      setHasSeen(seen);
    } catch (error) {
      console.warn('Failed to read tutorial state:', error);
      // Fail silently, default to false
    }
  }, []);

  const markAsSeen = () => {
    try {
      localStorage.setItem('tutorial_seen', 'true');
      setHasSeen(true);
    } catch (error) {
      console.warn('Failed to save tutorial state:', error);
      // Continue without persistence (acceptable degradation)
    }
  };

  return { hasSeen, markAsSeen };
}
