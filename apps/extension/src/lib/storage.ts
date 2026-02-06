import { SETTINGS_KEY, STORAGE_KEY, STORE_VERSION } from './constants';
import { DEFAULT_SETTINGS, type Settings } from './settings';

export type StatsTotals = {
  visits: number;
  sessions: number;
  activeMs: number;
  clicks: number;
  scrollDistance: number;
  tabSwitches: number;
};

export type PageStats = {
  key: string;
  url: string;
  host: string;
  path?: string;
  firstSeenAt: number;
  lastSeenAt: number;
  totals: StatsTotals;
  byDate: Record<string, StatsTotals>;
  byHour: Record<string, StatsTotals>;
};

export type Store = {
  version: number;
  pages: Record<string, PageStats>;
};

function emptyTotals(): StatsTotals {
  return {
    visits: 0,
    sessions: 0,
    activeMs: 0,
    clicks: 0,
    scrollDistance: 0,
    tabSwitches: 0,
  };
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<Settings> | undefined;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    onboarding: {
      ...DEFAULT_SETTINGS.onboarding,
      ...(stored?.onboarding ?? {}),
    },
    siteCategories: {
      ...DEFAULT_SETTINGS.siteCategories,
      ...(stored?.siteCategories ?? {}),
    },
  };
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function updateSettings(
  partial: Partial<Settings>
): Promise<Settings> {
  const current = await getSettings();
  const next = {
    ...current,
    ...partial,
    onboarding: {
      ...current.onboarding,
      ...(partial.onboarding ?? {}),
    },
    siteCategories:
      partial.siteCategories !== undefined
        ? partial.siteCategories
        : current.siteCategories,
  };
  await setSettings(next);
  return next;
}

export async function getStore(): Promise<Store> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Store | undefined;

  if (!stored) {
    return {
      version: STORE_VERSION,
      pages: {},
    };
  }

  if (stored.version === 1) {
    const migrated: Store = {
      version: STORE_VERSION,
      pages: {},
    };

    for (const [key, page] of Object.entries(stored.pages)) {
      migrated.pages[key] = {
        ...page,
        byHour: {},
      };
    }

    await setStore(migrated);
    return migrated;
  }

  if (stored.version !== STORE_VERSION) {
    return {
      version: STORE_VERSION,
      pages: {},
    };
  }

  return stored;
}

export async function setStore(store: Store): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: store });
}

export type StatsDelta = {
  visits?: number;
  sessions?: number;
  activeMs?: number;
  clicks?: number;
  scrollDistance?: number;
  tabSwitches?: number;
};

export type UpdatePageArgs = {
  key: string;
  url: string;
  host: string;
  path?: string;
  dateKey: string;
  hourKey: string;
  delta: StatsDelta;
};

export async function updatePageStats({
  key,
  url,
  host,
  path,
  dateKey,
  hourKey,
  delta,
}: UpdatePageArgs): Promise<void> {
  const store = await getStore();
  const now = Date.now();

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
    byHour: {},
  };

  const day = page.byDate[dateKey] ?? emptyTotals();
  const hour = page.byHour[hourKey] ?? emptyTotals();

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

  hour.visits += visits;
  hour.sessions += sessions;
  hour.activeMs += activeMs;
  hour.clicks += clicks;
  hour.tabSwitches += tabSwitches;

  if (typeof delta.scrollDistance === 'number') {
    page.totals.scrollDistance += delta.scrollDistance;
    day.scrollDistance += delta.scrollDistance;
    hour.scrollDistance += delta.scrollDistance;
  }

  page.lastSeenAt = now;
  page.byDate[dateKey] = day;
  page.byHour[hourKey] = hour;
  store.pages[key] = page;

  await setStore(store);
}

export async function clearStore(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

export type StorageUsage = {
  bytesInUse: number;
  /** With unlimitedStorage permission, there's no fixed quota. This is a soft reference limit for UI purposes. */
  quotaBytes: number | null;
  percentUsed: number | null;
};

/**
 * With the unlimitedStorage permission, chrome.storage.local has no fixed quota.
 * We set quotaBytes/percentUsed to null to indicate unlimited storage.
 * The UI can then display just the current usage without misleading quota warnings.
 */
export async function getStorageUsage(): Promise<StorageUsage> {
  const bytesInUse = await chrome.storage.local.getBytesInUse(null);

  return {
    bytesInUse,
    quotaBytes: null,
    percentUsed: null,
  };
}

/**
 * Aggregate pages by host to deduplicate entries with different paths.
 * Returns an array of PageStats aggregated by host, sorted by total active time (descending).
 */
export function aggregateByHost(pages: Record<string, PageStats>): PageStats[] {
  const hostMap = new Map<string, PageStats>();

  for (const page of Object.values(pages)) {
    const existing = hostMap.get(page.host);
    if (existing) {
      // Aggregate totals
      existing.totals.activeMs += page.totals.activeMs;
      existing.totals.visits += page.totals.visits;
      existing.totals.sessions += page.totals.sessions;
      existing.totals.clicks += page.totals.clicks;
      existing.totals.scrollDistance += page.totals.scrollDistance;
      existing.totals.tabSwitches += page.totals.tabSwitches;
      if (page.lastSeenAt > existing.lastSeenAt) {
        existing.lastSeenAt = page.lastSeenAt;
      }
    } else {
      hostMap.set(page.host, {
        ...page,
        key: page.host, // Use host as the key for deduplication
      });
    }
  }

  return Array.from(hostMap.values()).sort(
    (a, b) => b.totals.activeMs - a.totals.activeMs
  );
}
