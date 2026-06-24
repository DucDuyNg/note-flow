import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const CURRENT_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';

export function getCurrentVersion() {
  return CURRENT_VERSION;
}

export function getCurrentBuildTime() {
  return CURRENT_BUILD_TIME;
}

/**
 * Polls /version.json to detect when a newer deploy is live.
 * Returns { updateAvailable, latestVersion, reload, dismiss }.
 *
 * Triggers a check immediately on mount, again every 5 minutes, and whenever
 * the tab/app comes back into focus (covers the iPhone PWA cold-launch case).
 */
export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        // Cache-busting query + no-store header → always hit server.
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (cancelled || !version) return;
        if (version !== CURRENT_VERSION) {
          setLatestVersion(version);
          setUpdateAvailable(true);
        }
      } catch (err) {
        // Network failures are fine — try again next interval.
        console.debug('Update check skipped:', err?.message);
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const onFocus = () => check();
    const onVisibility = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return {
    currentVersion: CURRENT_VERSION,
    latestVersion,
    updateAvailable: updateAvailable && !dismissed,
    dismiss: () => setDismissed(true),
    reload: () => {
      // Force a fresh fetch by bypassing the bfcache.
      window.location.reload();
    },
  };
}
