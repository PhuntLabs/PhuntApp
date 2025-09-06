
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

const LOCAL_STORAGE_KEY = 'mobile-view-enabled';

export function useMobileView() {
  const isSystemMobile = useIsMobile();
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    setIsTestMode(saved === 'true');
  }, []);

  const handleSetIsMobileView = useCallback((enabled: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));
    setIsTestMode(enabled);
    // We might need to force a reload to apply all layout changes correctly
    window.location.reload();
  }, []);

  return {
    isMobileView: isSystemMobile || isTestMode,
    setIsMobileView: handleSetIsMobileView,
  };
}
