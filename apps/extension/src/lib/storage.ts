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
  };
  await setSettings(next);
  return next;
}

export async function getStore(): Promise<Store> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Store | undefined;

  if (!stored || stored.version !== STORE_VERSION) {
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
  delta: StatsDelta;
};

export async function updatePageStats({
  key,
  url,
  host,
  path,
  dateKey,
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

  if (typeof delta.scrollDistance === 'number') {
    page.totals.scrollDistance += delta.scrollDistance;
    day.scrollDistance += delta.scrollDistance;
  }

  page.lastSeenAt = now;
  page.byDate[dateKey] = day;
  store.pages[key] = page;

  await setStore(store);
}

export async function clearStore(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
