
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
  // Initialize state directly from localStorage.
  const [isTestMode, setIsTestMode] = useState(getInitialTestMode);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Sync state if localStorage was changed in another tab.
    const handleStorageChange = () => {
      setIsTestMode(getInitialTestMode());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSetIsMobileView = useCallback((enabled: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));
    // The reload is necessary to re-evaluate the entire component tree
    // with the new mobile/desktop view setting.
    window.location.reload();
  }, []);

  // On the server or before the client has mounted, default to system's value to avoid hydration mismatches.
  if (!hasMounted) {
    return {
      isMobileView: isSystemMobile,
      setIsMobileView: () => {},
    };
  }

  return {
    isMobileView: isSystemMobile || isTestMode,
    setIsMobileView: handleSetIsMobileView,
  };
}
