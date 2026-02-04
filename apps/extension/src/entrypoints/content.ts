import type { ContentScriptDefinition } from 'wxt';
import { defineContentScript } from 'wxt/sandbox';

import { SETTINGS_KEY } from '../lib/constants';
import { getLocalDateKey } from '../lib/date';
import { isHostExcluded } from '../lib/settings';
import { getSettings, getStore, updatePageStats } from '../lib/storage';
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
    const dataGranularity = settings.dataGranularity;

    const urlParts = getUrlParts(window.location.href, dataGranularity);

    if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) return;

    let stopped = false;
    let intervalId: number | undefined;

    let activeMs = 0;
    let lastActiveAt =
      document.visibilityState === 'visible' ? Date.now() : null;
    let clicks = 0;
    let scrollMax = 0;
    let tabSwitches = 0;

    let lastFlushedActiveMs = 0;
    let lastFlushedClicks = 0;
    let lastFlushedTabSwitches = 0;

    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };

    const updateScrollMax = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        scrollMax = Math.max(scrollMax, 1);
        return;
      }
      const ratio = window.scrollY / scrollHeight;
      const clamped = Number.isFinite(ratio)
        ? Math.min(Math.max(ratio, 0), 1)
        : 0;
      scrollMax = Math.max(scrollMax, clamped);
    };

    const flush = async () => {
      if (stopped || !isContextValid()) {
        stop();
        return;
      }

      if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) return;

      const now = Date.now();
      const totalActiveMs = lastActiveAt
        ? activeMs + (now - lastActiveAt)
        : activeMs;
      const deltaActiveMs = Math.max(0, totalActiveMs - lastFlushedActiveMs);
      const deltaClicks = Math.max(0, clicks - lastFlushedClicks);
      const deltaTabSwitches = Math.max(
        0,
        tabSwitches - lastFlushedTabSwitches
      );

      if (
        deltaActiveMs === 0 &&
        deltaClicks === 0 &&
        deltaTabSwitches === 0 &&
        scrollMax === 0
      ) {
        return;
      }

      lastFlushedActiveMs = totalActiveMs;
      lastFlushedClicks = clicks;
      lastFlushedTabSwitches = tabSwitches;

      try {
        await updatePageStats({
          key: urlParts.key,
          url: urlParts.url,
          host: urlParts.host,
          path: urlParts.path,
          dateKey: getLocalDateKey(),
          delta: {
            activeMs: deltaActiveMs,
            clicks: deltaClicks,
            scrollMax,
            tabSwitches: deltaTabSwitches,
          },
        });
      } catch {
        stop();
      }
    };

    const handleVisibilityChange = () => {
      if (stopped) return;
      if (document.visibilityState === 'hidden') {
        if (lastActiveAt) {
          activeMs += Date.now() - lastActiveAt;
          lastActiveAt = null;
        }
        tabSwitches += 1;
        void flush();
      } else if (!lastActiveAt) {
        lastActiveAt = Date.now();
      }
    };

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (stopped || areaName !== 'local') return;
      const next = changes[SETTINGS_KEY]?.newValue;
      if (!next) return;
      enabled = Boolean(next.enabled);
      excludeHosts = next.excludeHosts ?? [];
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', () => {
      if (lastActiveAt) {
        activeMs += Date.now() - lastActiveAt;
        lastActiveAt = null;
      }
      void flush();
    });
    document.addEventListener('click', () => {
      if (!stopped) clicks += 1;
    });
    window.addEventListener('scroll', updateScrollMax, { passive: true });

    intervalId = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    try {
      chrome.storage.onChanged.addListener(handleStorageChange);
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
      await updatePageStats({
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
    } catch {
      stop();
      return;
    }

    updateScrollMax();

    window.addEventListener('beforeunload', stop);
  },
});

export default contentScript;
