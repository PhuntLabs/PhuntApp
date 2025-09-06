
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

const LOCAL_STORAGE_KEY = 'mobile-view-enabled';

// This function safely gets the value from localStorage, only running on the client.
const getInitialTestMode = (): boolean => {
  if (typeof window !== 'undefined') {
    // Check for URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('m') === 'true') {
        return true;
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
  }
  return false;
};

export function useMobileView() {
  const isSystemMobile = useIsMobile();
  const [isTestMode, setIsTestMode] = useState(getInitialTestMode);
  
  // On initial client-side mount, sync the state from localStorage.
  useEffect(() => {
    setIsTestMode(getInitialTestMode());
  }, []);


  const setIsMobileView = useCallback((enabled: boolean) => {
    // Force the class on the document to reflect the change visually before reload.
    // This makes the change feel instant and fixes the state issue.
    if (enabled) {
        document.documentElement.classList.add('mobile-test-mode');
    } else {
        document.documentElement.classList.remove('mobile-test-mode');
    }
    
    // Update the local storage value immediately.
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));

    // Update the React state.
    setIsTestMode(enabled);
    
    // Reload to apply the correct layout across the entire application.
    window.location.reload();
  }, []);
  
  const isPwaMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('m') === 'true';

  return {
    isMobileView: isSystemMobile || isTestMode || isPwaMode,
    setIsMobileView,
  };
}
