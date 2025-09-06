
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

const LOCAL_STORAGE_KEY = 'mobile-view-enabled';

const getInitialTestMode = (): boolean => {
  if (typeof window !== 'undefined') {
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
  const [isTestMode, setIsTestMode] = useState(false);
  const [isPwaMode, setIsPwaMode] = useState(false);

  useEffect(() => {
    const pwa = new URLSearchParams(window.location.search).get('m') === 'true';
    setIsPwaMode(pwa);
    setIsTestMode(getInitialTestMode());
  }, []);

  const setIsMobileView = useCallback((enabled: boolean) => {
      document.documentElement.classList.toggle('mobile-test-mode', enabled);
      localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));
      setIsTestMode(enabled);
      window.location.reload();
  }, []);

  return {
    isMobileView: isSystemMobile || isTestMode || isPwaMode,
    isPwaMode,
    setIsMobileView,
  };
}
