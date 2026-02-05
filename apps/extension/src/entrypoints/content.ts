import type { ContentScriptDefinition } from 'wxt';
import { defineContentScript } from 'wxt/sandbox';

import { SETTINGS_KEY } from '../lib/constants';
import { getLocalDateKey } from '../lib/date';
import type { PingMessage, PingResponse } from '../lib/messaging';
import { sendUpdateStats } from '../lib/messaging';
import { isHostExcluded } from '../lib/settings';
import { getSettings, getStore } from '../lib/storage';
import { getUrlParts } from '../lib/url';

const FLUSH_INTERVAL_MS = 5000;
const SESSION_GAP_MS = 30 * 60 * 1000;

function isContextValid(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

const contentScript: ContentScriptDefinition = defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main() {
    if (!isContextValid()) return;

    let settings;
    try {
      settings = await getSettings();
    } catch {
      return;
    }

    const hasConsent = settings.onboarding.consentConfirmed;
    if (!hasConsent) return;

    let enabled = settings.enabled;
    let excludeHosts = settings.excludeHosts;
    let trackingMode = settings.trackingMode;
    const dataGranularity = settings.dataGranularity;

    const urlParts = getUrlParts(window.location.href, dataGranularity);

    if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) return;

    let stopped = false;
    let intervalId: number | undefined;
    let flushInProgress = false;

    let activeMs = 0;
    let windowFocused = document.hasFocus();
    const shouldTrackNow =
      document.visibilityState === 'visible' &&
      (trackingMode === 'visible' || windowFocused);
    let lastActiveAt = shouldTrackNow ? Date.now() : null;
    let clicks = 0;
    let scrollDistance = 0;
    let lastScrollY = window.scrollY;
    let tabSwitches = 0;

    let lastFlushedActiveMs = 0;
    let lastFlushedClicks = 0;
    let lastFlushedTabSwitches = 0;
    let lastFlushedScrollDistance = 0;

    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };

    const updateScrollDistance = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);
      if (delta > 0 && window.innerHeight > 0) {
        scrollDistance += delta / window.innerHeight;
      }
      lastScrollY = currentScrollY;
    };

    const flush = async (isUnload = false) => {
      if (stopped || !isContextValid()) {
        stop();
        return;
      }

      if (flushInProgress && !isUnload) return;
      flushInProgress = true;

      if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) {
        flushInProgress = false;
        return;
      }

      const now = Date.now();

      const shouldBeTracking =
        document.visibilityState === 'visible' &&
        (trackingMode === 'visible' || windowFocused);
      if (shouldBeTracking && !lastActiveAt) {
        lastActiveAt = now;
      }

      const totalActiveMs = lastActiveAt
        ? activeMs + (now - lastActiveAt)
        : activeMs;
      const deltaActiveMs = Math.max(0, totalActiveMs - lastFlushedActiveMs);
      const deltaClicks = Math.max(0, clicks - lastFlushedClicks);
      const deltaTabSwitches = Math.max(
        0,
        tabSwitches - lastFlushedTabSwitches
      );
      const deltaScrollDistance = Math.max(
        0,
        scrollDistance - lastFlushedScrollDistance
      );

      if (
        deltaActiveMs === 0 &&
        deltaClicks === 0 &&
        deltaTabSwitches === 0 &&
        deltaScrollDistance === 0
      ) {
        flushInProgress = false;
        return;
      }

      const prevFlushedActiveMs = lastFlushedActiveMs;
      const prevFlushedClicks = lastFlushedClicks;
      const prevFlushedTabSwitches = lastFlushedTabSwitches;
      const prevFlushedScrollDistance = lastFlushedScrollDistance;

      lastFlushedActiveMs = totalActiveMs;
      lastFlushedClicks = clicks;
      lastFlushedTabSwitches = tabSwitches;
      lastFlushedScrollDistance = scrollDistance;

      try {
        const response = await sendUpdateStats({
          key: urlParts.key,
          url: urlParts.url,
          host: urlParts.host,
          path: urlParts.path,
          dateKey: getLocalDateKey(),
          delta: {
            activeMs: deltaActiveMs,
            clicks: deltaClicks,
            scrollDistance: deltaScrollDistance,
            tabSwitches: deltaTabSwitches,
          },
        });

        if (!response.success) {
          lastFlushedActiveMs = prevFlushedActiveMs;
          lastFlushedClicks = prevFlushedClicks;
          lastFlushedTabSwitches = prevFlushedTabSwitches;
          lastFlushedScrollDistance = prevFlushedScrollDistance;

          if (
            response.error?.includes('Extension context invalidated') ||
            response.error?.includes('Receiving end does not exist')
          ) {
            stop();
          }
        }
      } catch {
        lastFlushedActiveMs = prevFlushedActiveMs;
        lastFlushedClicks = prevFlushedClicks;
        lastFlushedTabSwitches = prevFlushedTabSwitches;
        lastFlushedScrollDistance = prevFlushedScrollDistance;
        stop();
      } finally {
        flushInProgress = false;
      }
    };

    const handleVisibilityChange = () => {
      if (stopped) return;
      const now = Date.now();

      if (document.visibilityState === 'hidden') {
        if (lastActiveAt) {
          activeMs += now - lastActiveAt;
          lastActiveAt = null;
        }
        tabSwitches += 1;
        void flush();
      } else {
        const shouldTrack = trackingMode === 'visible' || windowFocused;
        if (!lastActiveAt && shouldTrack) {
          lastActiveAt = now;
        }
      }
    };

    const handleFocus = () => {
      windowFocused = true;
      if (stopped || trackingMode !== 'focused') return;
      if (!lastActiveAt && document.visibilityState === 'visible') {
        lastActiveAt = Date.now();
      }
    };

    const handleBlur = () => {
      windowFocused = false;
      if (stopped || trackingMode !== 'focused') return;
      if (lastActiveAt) {
        activeMs += Date.now() - lastActiveAt;
        lastActiveAt = null;
      }
    };

    const resetMetrics = () => {
      if (lastActiveAt) {
        lastActiveAt = null;
      }
      activeMs = 0;
      clicks = 0;
      scrollDistance = 0;
      tabSwitches = 0;
      lastFlushedActiveMs = 0;
      lastFlushedClicks = 0;
      lastFlushedScrollDistance = 0;
      lastFlushedTabSwitches = 0;
    };

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (stopped || areaName !== 'local') return;
      const next = changes[SETTINGS_KEY]?.newValue;
      if (!next) return;

      const newEnabled = Boolean(next.enabled);
      const newExcludeHosts = next.excludeHosts ?? [];
      const wasExcluded =
        !enabled || isHostExcluded(urlParts.host, excludeHosts);
      const isNowExcluded =
        !newEnabled || isHostExcluded(urlParts.host, newExcludeHosts);

      if (isNowExcluded && !wasExcluded) {
        resetMetrics();
      } else if (!isNowExcluded && wasExcluded) {
        resetMetrics();
        if (
          document.visibilityState === 'visible' &&
          (next.trackingMode === 'visible' || windowFocused)
        ) {
          lastActiveAt = Date.now();
        }
      }

      enabled = newEnabled;
      excludeHosts = newExcludeHosts;
      trackingMode = next.trackingMode ?? 'focused';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    window.addEventListener('pagehide', () => {
      if (lastActiveAt) {
        activeMs += Date.now() - lastActiveAt;
        lastActiveAt = null;
      }
      void flush(true);
    });

    document.addEventListener('click', () => {
      if (!stopped) clicks += 1;
    });

    window.addEventListener('scroll', updateScrollDistance, { passive: true });

    intervalId = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    try {
      chrome.storage.onChanged.addListener(handleStorageChange);
    } catch {
      stop();
      return;
    }

    const handlePing = (
      message: PingMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: PingResponse) => void
    ) => {
      if (message.type === 'PING') {
        sendResponse({ active: !stopped });
        return true;
      }
      return false;
    };

    try {
      chrome.runtime.onMessage.addListener(handlePing);
    } catch {
      stop();
      return;
    }

    let store;
    try {
      store = await getStore();
    } catch {
      stop();
      return;
    }

    const existingPage = store.pages[urlParts.key];
    const now = Date.now();
    const isNewSession =
      !existingPage || now - existingPage.lastSeenAt > SESSION_GAP_MS;

    try {
      const response = await sendUpdateStats({
        key: urlParts.key,
        url: urlParts.url,
        host: urlParts.host,
        path: urlParts.path,
        dateKey: getLocalDateKey(),
        delta: {
          visits: 1,
          sessions: isNewSession ? 1 : 0,
        },
      });

      if (!response.success) {
        stop();
        return;
      }
    } catch {
      stop();
      return;
    }

    updateScrollDistance();

    window.addEventListener('beforeunload', () => {
      if (lastActiveAt) {
        activeMs += Date.now() - lastActiveAt;
        lastActiveAt = null;
      }
      void flush(true);
      stop();
    });
  },
});

export default contentScript;
