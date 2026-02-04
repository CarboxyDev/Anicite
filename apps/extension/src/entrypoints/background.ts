import type { BackgroundDefinition } from 'wxt';
import { defineBackground } from 'wxt/sandbox';

import { SETTINGS_KEY, STORAGE_KEY, STORE_VERSION } from '../lib/constants';
import type { Message, StatsResponse } from '../lib/messaging';
import { DEFAULT_SETTINGS } from '../lib/settings';
import type { PageStats, StatsDelta, Store } from '../lib/storage';
import { setSettings } from '../lib/storage';

function emptyTotals() {
  return {
    visits: 0,
    sessions: 0,
    activeMs: 0,
    clicks: 0,
    scrollMax: 0,
    tabSwitches: 0,
  };
}

class StatsWriteQueue {
  private queue: Array<{
    payload: {
      key: string;
      url: string;
      host: string;
      path?: string;
      dateKey: string;
      delta: StatsDelta;
    };
    resolve: (response: StatsResponse) => void;
  }> = [];
  private processing = false;

  enqueue(
    payload: {
      key: string;
      url: string;
      host: string;
      path?: string;
      dateKey: string;
      delta: StatsDelta;
    },
    resolve: (response: StatsResponse) => void
  ): void {
    this.queue.push({ payload, resolve });
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.queue.length);

      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const stored = result[STORAGE_KEY] as Store | undefined;
        const store: Store =
          stored && stored.version === STORE_VERSION
            ? stored
            : { version: STORE_VERSION, pages: {} };

        const now = Date.now();

        for (const { payload } of batch) {
          const { key, url, host, path, dateKey, delta } = payload;

          const existing = store.pages[key];
          const page: PageStats = existing ?? {
            key,
            url,
            host,
            path,
            firstSeenAt: now,
            lastSeenAt: now,
            totals: emptyTotals(),
            byDate: {},
          };

          const day = page.byDate[dateKey] ?? emptyTotals();

          const visits = delta.visits ?? 0;
          const sessions = delta.sessions ?? 0;
          const activeMs = delta.activeMs ?? 0;
          const clicks = delta.clicks ?? 0;
          const tabSwitches = delta.tabSwitches ?? 0;

          page.totals.visits += visits;
          page.totals.sessions += sessions;
          page.totals.activeMs += activeMs;
          page.totals.clicks += clicks;
          page.totals.tabSwitches += tabSwitches;
          day.visits += visits;
          day.sessions += sessions;
          day.activeMs += activeMs;
          day.clicks += clicks;
          day.tabSwitches += tabSwitches;

          if (typeof delta.scrollMax === 'number') {
            page.totals.scrollMax = Math.max(
              page.totals.scrollMax,
              delta.scrollMax
            );
            day.scrollMax = Math.max(day.scrollMax, delta.scrollMax);
          }

          page.lastSeenAt = now;
          page.byDate[dateKey] = day;
          store.pages[key] = page;
        }

        await chrome.storage.local.set({ [STORAGE_KEY]: store });

        for (const { resolve } of batch) {
          resolve({ success: true });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        for (const { resolve } of batch) {
          resolve({ success: false, error: errorMsg });
        }
      }
    }

    this.processing = false;
  }
}

const writeQueue = new StatsWriteQueue();

function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: StatsResponse) => void
): boolean {
  if (message.type === 'UPDATE_STATS') {
    writeQueue.enqueue(message.payload, sendResponse);
    return true;
  }

  return false;
}

const background: BackgroundDefinition = defineBackground(() => {
  chrome.runtime.onMessage.addListener(handleMessage);

  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install') {
      return;
    }

    const existing = await chrome.storage.local.get(SETTINGS_KEY);
    if (!existing[SETTINGS_KEY]) {
      await setSettings(DEFAULT_SETTINGS);
    }

    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  });
});

export default background;
