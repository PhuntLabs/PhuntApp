
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

const LOCAL_STORAGE_KEY = 'mobile-view-enabled';

// This function safely gets the value from localStorage, only running on the client.
const getInitialTestMode = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
  }
  return false;
};

export function useMobileView() {
  const isSystemMobile = useIsMobile();
  const [isTestMode, setIsTestMode] = useState(false);
  
  // On initial client-side mount, sync the state from localStorage.
  useEffect(() => {
    setIsTestMode(getInitialTestMode());
  }, []);


  const setIsMobileView = useCallback((enabled: boolean) => {
    // 1. Update the local storage value immediately.
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));
    
    // 2. Force the class on the document to reflect the change visually before reload.
    // This makes the change feel instant and fixes the state issue.
    if (enabled) {
        document.documentElement.classList.add('mobile-test-mode');
    } else {
        document.documentElement.classList.remove('mobile-test-mode');
    }

    // 3. Update the React state.
    setIsTestMode(enabled);

    // 4. Reload to apply the correct layout across the entire application.
    window.location.reload();
  }, []);

  return {
    isMobileView: isSystemMobile || isTestMode,
    setIsMobileView,
  };
}
