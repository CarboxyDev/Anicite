import type { ContentScriptDefinition } from 'wxt';
import { defineContentScript } from 'wxt/sandbox';

import { SETTINGS_KEY } from '../lib/constants';
import { getLocalDateKey } from '../lib/date';
import { type DataGranularity, isHostExcluded } from '../lib/settings';
import { getSettings, updatePageStats } from '../lib/storage';
import { getUrlParts } from '../lib/url';

const FLUSH_INTERVAL_MS = 10000;

const contentScript: ContentScriptDefinition = defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main() {
    let enabled = true;
    let excludeHosts: string[] = [];
    let dataGranularity: DataGranularity = 'path';

    const settings = await getSettings();
    enabled = settings.enabled;
    excludeHosts = settings.excludeHosts;
    dataGranularity = settings.dataGranularity;

    const hasConsent = settings.onboarding.consentConfirmed;
    if (!hasConsent) {
      return;
    }

    const urlParts = getUrlParts(window.location.href, dataGranularity);

    if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) {
      return;
    }

    let activeMs = 0;
    let lastActiveAt =
      document.visibilityState === 'visible' ? Date.now() : null;
    let clicks = 0;
    let scrollMax = 0;

    let lastFlushedActiveMs = 0;
    let lastFlushedClicks = 0;

    const dateKey = getLocalDateKey();

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
      if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) {
        return;
      }

      const now = Date.now();
      const totalActiveMs = lastActiveAt
        ? activeMs + (now - lastActiveAt)
        : activeMs;
      const deltaActiveMs = Math.max(0, totalActiveMs - lastFlushedActiveMs);
      const deltaClicks = Math.max(0, clicks - lastFlushedClicks);

      if (deltaActiveMs === 0 && deltaClicks === 0 && scrollMax === 0) {
        return;
      }

      lastFlushedActiveMs = totalActiveMs;
      lastFlushedClicks = clicks;

      await updatePageStats({
        key: urlParts.key,
        url: urlParts.url,
        host: urlParts.host,
        path: urlParts.path,
        dateKey,
        delta: {
          activeMs: deltaActiveMs,
          clicks: deltaClicks,
          scrollMax,
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (lastActiveAt) {
          activeMs += Date.now() - lastActiveAt;
          lastActiveAt = null;
        }
        void flush();
      } else if (!lastActiveAt) {
        lastActiveAt = Date.now();
      }
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
      clicks += 1;
    });

    const scrollListener = () => {
      updateScrollMax();
    };

    window.addEventListener('scroll', scrollListener, { passive: true });

    const interval = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }
      const next = changes[SETTINGS_KEY]?.newValue;
      if (!next) {
        return;
      }
      enabled = Boolean(next.enabled);
      excludeHosts = next.excludeHosts ?? [];
      dataGranularity = next.dataGranularity ?? 'path';
    });

    await updatePageStats({
      key: urlParts.key,
      url: urlParts.url,
      host: urlParts.host,
      path: urlParts.path,
      dateKey,
      delta: {
        visits: 1,
      },
    });

    updateScrollMax();

    window.addEventListener('beforeunload', () => {
      window.clearInterval(interval);
    });
  },
});

export default contentScript;
