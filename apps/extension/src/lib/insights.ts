import { type Category, CATEGORY_LIST, getCategoryForHost } from './categories';
import { getLocalDateKey } from './date';
import type { StatsTotals, Store } from './storage';

export type Period = 'today' | '7days' | '30days' | 'all';

export type DayStats = {
  date: string;
  label: string;
  stats: StatsTotals;
};

export type SiteStats = {
  key: string;
  host: string;
  path?: string;
  stats: StatsTotals;
};

export type AggregatedStats = {
  totals: StatsTotals & { sitesCount: number };
  byDate: DayStats[];
  topSites: SiteStats[];
};

export type CategoryStats = {
  category: Category;
  stats: StatsTotals;
  percentage: number;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getRelativeLabel(dateKey: string): string | null {
  const today = getLocalDateKey(new Date());
  if (dateKey === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === getLocalDateKey(yesterday)) return 'Yest';

  return null;
}

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

export function getDayLabel(dateKey: string): string {
  const relative = getRelativeLabel(dateKey);
  if (relative) return relative;

  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return DAY_NAMES[date.getDay()];
}

export function getDateKeysForPeriod(period: Period): string[] {
  if (period === 'all') return [];

  const days = period === 'today' ? 1 : period === '7days' ? 7 : 30;
  const keys: string[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    keys.push(getLocalDateKey(date));
  }

  return keys;
}

function addStats(target: StatsTotals, source: StatsTotals): void {
  target.visits += source.visits;
  target.sessions += source.sessions;
  target.activeMs += source.activeMs;
  target.clicks += source.clicks;
  target.tabSwitches += source.tabSwitches;
  target.scrollDistance += source.scrollDistance;
}

export function aggregateByPeriod(
  store: Store,
  period: Period
): AggregatedStats {
  const dateKeys = getDateKeysForPeriod(period);
  const isAllTime = period === 'all';

  const totals: StatsTotals & { sitesCount: number } = {
    ...emptyTotals(),
    sitesCount: 0,
  };

  const dateMap = new Map<string, StatsTotals>();
  const siteMap = new Map<string, SiteStats>();

  for (const page of Object.values(store.pages)) {
    let siteStats: StatsTotals | null = null;

    if (isAllTime) {
      siteStats = { ...page.totals };
      addStats(totals, page.totals);

      for (const [dateKey, dayStats] of Object.entries(page.byDate)) {
        const existing = dateMap.get(dateKey) ?? emptyTotals();
        addStats(existing, dayStats);
        dateMap.set(dateKey, existing);
      }
    } else {
      siteStats = emptyTotals();

      for (const dateKey of dateKeys) {
        const dayStats = page.byDate[dateKey];
        if (dayStats) {
          addStats(siteStats, dayStats);
          addStats(totals, dayStats);

          const existing = dateMap.get(dateKey) ?? emptyTotals();
          addStats(existing, dayStats);
          dateMap.set(dateKey, existing);
        }
      }
    }

    if (siteStats && siteStats.activeMs > 0) {
      totals.sitesCount++;
      siteMap.set(page.key, {
        key: page.key,
        host: page.host,
        path: page.path,
        stats: siteStats,
      });
    }
  }

  const topSites = Array.from(siteMap.values())
    .sort((a, b) => b.stats.activeMs - a.stats.activeMs)
    .slice(0, 10);

  const sortedDateKeys = Array.from(dateMap.keys()).sort();
  const displayKeys = isAllTime
    ? sortedDateKeys.slice(-14)
    : dateKeys.slice().reverse();

  const byDate: DayStats[] = displayKeys.map((date) => ({
    date,
    label: getDayLabel(date),
    stats: dateMap.get(date) ?? emptyTotals(),
  }));

  return { totals, byDate, topSites };
}

export function aggregateByCategory(
  store: Store,
  period: Period,
  userCategories: Record<string, Category>
): CategoryStats[] {
  const dateKeys = getDateKeysForPeriod(period);
  const isAllTime = period === 'all';

  const categoryMap = new Map<Category, StatsTotals>();

  for (const cat of CATEGORY_LIST) {
    categoryMap.set(cat, emptyTotals());
  }

  let totalActiveMs = 0;

  for (const page of Object.values(store.pages)) {
    const category = getCategoryForHost(page.host, userCategories);
    const catStats = categoryMap.get(category)!;

    if (isAllTime) {
      addStats(catStats, page.totals);
      totalActiveMs += page.totals.activeMs;
    } else {
      for (const dateKey of dateKeys) {
        const dayStats = page.byDate[dateKey];
        if (dayStats) {
          addStats(catStats, dayStats);
          totalActiveMs += dayStats.activeMs;
        }
      }
    }
  }

  const result: CategoryStats[] = [];

  for (const category of CATEGORY_LIST) {
    const stats = categoryMap.get(category)!;
    if (stats.activeMs > 0) {
      result.push({
        category,
        stats,
        percentage:
          totalActiveMs > 0 ? (stats.activeMs / totalActiveMs) * 100 : 0,
      });
    }
  }

  result.sort((a, b) => b.stats.activeMs - a.stats.activeMs);

  return result;
}
