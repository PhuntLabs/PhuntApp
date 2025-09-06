
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

const LOCAL_STORAGE_KEY = 'mobile-view-enabled';

export function useMobileView() {
  const isSystemMobile = useIsMobile();
  const [isTestMode, setIsTestMode] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  useEffect(() => {
    // This effect runs once on component mount to check localStorage.
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    setIsTestMode(saved === 'true');
    setHasCheckedStorage(true);
  }, []); // Empty dependency array ensures it runs only once on mount.

  const handleSetIsMobileView = useCallback((enabled: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));
    setIsTestMode(enabled);
    // We might need to force a reload to apply all layout changes correctly
    window.location.reload();
  }, []);

  // Don't render a decision until we've checked localStorage.
  // This prevents a flash of incorrect UI on initial load.
  if (!hasCheckedStorage) {
    return {
        isMobileView: isSystemMobile, // Default to system value before storage is checked
        setIsMobileView: handleSetIsMobileView
    };
  }

  return {
    isMobileView: isSystemMobile || isTestMode,
    setIsMobileView: handleSetIsMobileView,
  };
}
