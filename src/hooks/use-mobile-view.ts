
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
  const [isTestMode, setIsTestMode] = useState(getInitialTestMode);

  // When the component mounts on the client, sync state from localStorage
  useEffect(() => {
    setIsTestMode(getInitialTestMode());
  }, []);

  const handleSetIsMobileView = useCallback((enabled: boolean) => {
    // 1. Update the state
    setIsTestMode(enabled);
    // 2. Persist to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));
    // 3. Reload to apply layout changes across the app
    window.location.reload();
  }, []);

  return {
    isMobileView: isSystemMobile || isTestMode,
    setIsMobileView: handleSetIsMobileView,
  };
}
