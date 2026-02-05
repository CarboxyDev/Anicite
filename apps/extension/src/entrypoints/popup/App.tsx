import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  Clock,
  Eye,
  Globe,
  Info,
  MousePointerClick,
  MoveVertical,
  Settings as SettingsIcon,
  SwatchBook,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  CATEGORIES,
  type Category,
  CATEGORY_LIST,
  getCategoryForHost,
} from '../../lib/categories';
import { SETTINGS_KEY, STORAGE_KEY } from '../../lib/constants';
import { getLocalDateKey } from '../../lib/date';
import { formatDuration } from '../../lib/format';
import {
  DEFAULT_SETTINGS,
  isHostExcluded,
  type Settings,
} from '../../lib/settings';
import {
  getSettings,
  getStore,
  type StatsTotals,
  type Store,
  updateSettings,
} from '../../lib/storage';
import { getUrlParts } from '../../lib/url';

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  productive: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  social: { bg: 'bg-blue-500', text: 'text-blue-500' },
  entertainment: { bg: 'bg-purple-500', text: 'text-purple-500' },
  shopping: { bg: 'bg-amber-500', text: 'text-amber-500' },
  reference: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-500' },
  other: { bg: 'bg-zinc-400', text: 'text-zinc-400' },
};

const DEFAULT_STATS: StatsTotals = {
  visits: 0,
  sessions: 0,
  activeMs: 0,
  clicks: 0,
  scrollDistance: 0,
  tabSwitches: 0,
};

interface TodayTotals extends StatsTotals {
  sitesCount: number;
}

function computeTodayTotals(store: Store): TodayTotals {
  const dateKey = getLocalDateKey();
  const totals: TodayTotals = { ...DEFAULT_STATS, sitesCount: 0 };

  for (const entry of Object.values(store.pages)) {
    const day = entry.byDate[dateKey];
    if (!day) continue;
    totals.visits += day.visits;
    totals.sessions += day.sessions;
    totals.activeMs += day.activeMs;
    totals.clicks += day.clicks;
    totals.tabSwitches += day.tabSwitches;
    totals.scrollDistance += day.scrollDistance ?? 0;
    totals.sitesCount += 1;
  }

  return totals;
}

function getScrollIntensity(
  scrollDistance: number | undefined,
  activeMs: number
): number | null {
  const distance = scrollDistance ?? 0;
  const activeMinutes = activeMs / 60000;
  if (activeMinutes < 0.1) return null;
  const intensity = distance / activeMinutes;
  if (!Number.isFinite(intensity)) return null;
  return intensity;
}

function formatScrollIntensity(intensity: number | null): string {
  if (intensity === null) return '–';
  return intensity.toFixed(1);
}

function getScrollIntensityColor(intensity: number | null): string {
  if (intensity === null) return '';
  if (intensity < 1) return 'text-green-500';
  if (intensity < 5) return 'text-yellow-500';
  return 'text-red-500';
}

function ScrollIntensityTooltip() {
  return (
    <div className="group relative inline-flex">
      <Info className="group-hover:text-foreground h-2.5 w-2.5 cursor-help transition-colors" />
      <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="w-max max-w-[220px] rounded-md bg-zinc-900 px-3 py-2.5 text-xs text-white shadow-lg">
          <p className="mb-1.5 font-semibold">Scroll intensity</p>
          <p className="mb-2.5 text-[11px] leading-relaxed text-zinc-400">
            Screens scrolled per minute
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-baseline gap-2">
              <span className="w-6 font-semibold text-green-400">&lt; 1</span>
              <span className="text-zinc-300">Focused reading</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="w-6 font-semibold text-yellow-400">1–5</span>
              <span className="text-zinc-300">Normal browsing</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="w-6 font-semibold text-red-400">5+</span>
              <span className="text-zinc-300">Doom scrolling</span>
            </div>
          </div>
        </div>
        <div className="ml-1 h-2 w-2 -translate-y-1 rotate-45 rounded-sm bg-zinc-900" />
      </div>
    </div>
  );
}

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentHost, setCurrentHost] = useState<string | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsTotals>(DEFAULT_STATS);
  const [todayTotals, setTodayTotals] = useState<TodayTotals>({
    ...DEFAULT_STATS,
    sitesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const currentKeyRef = useRef<string | null>(null);

  const isExcluded = useMemo(() => {
    if (!currentHost) {
      return false;
    }
    return isHostExcluded(currentHost, settings.excludeHosts);
  }, [currentHost, settings.excludeHosts]);

  const currentCategory = useMemo(() => {
    if (!currentHost) return 'other';
    return getCategoryForHost(currentHost, settings.siteCategories);
  }, [currentHost, settings.siteCategories]);

  const isOnboardingComplete = useMemo(() => {
    return Object.values(settings.onboarding).every(Boolean);
  }, [settings.onboarding]);

  const handleCategoryChange = async (category: Category) => {
    if (!currentHost) return;
    const newCategories = { ...settings.siteCategories };
    const defaultCategory = getCategoryForHost(currentHost, {});

    if (category === defaultCategory) {
      delete newCategories[currentHost];
    } else {
      newCategories[currentHost] = category;
    }

    const next = await updateSettings({ siteCategories: newCategories });
    setSettings(next);
  };

  const updateFromStore = useCallback((store: Store) => {
    const dateKey = getLocalDateKey();
    const key = currentKeyRef.current;

    if (key) {
      const page = store.pages[key];
      setStats(page?.byDate[dateKey] ?? DEFAULT_STATS);
    }

    setTodayTotals(computeTodayTotals(store));
  }, []);

  useEffect(() => {
    const init = async () => {
      const storedSettings = await getSettings();
      setSettings(storedSettings);

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab?.url && tab.id) {
        const urlParts = getUrlParts(tab.url, storedSettings.dataGranularity);
        setCurrentHost(urlParts.host);
        setCurrentKey(urlParts.key);
        currentKeyRef.current = urlParts.key;

        const store = await getStore();
        updateFromStore(store);
      }

      setIsLoading(false);
    };

    void init();
  }, [updateFromStore]);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local') return;

      if (changes[SETTINGS_KEY]?.newValue) {
        setSettings(changes[SETTINGS_KEY].newValue as Settings);
      }

      if (changes[STORAGE_KEY]?.newValue) {
        updateFromStore(changes[STORAGE_KEY].newValue as Store);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [updateFromStore]);

  if (!isOnboardingComplete) {
    return (
      <div className="bg-background text-foreground w-[320px] p-5 text-sm">
        <div className="text-center">
          <p className="text-primary text-xs font-semibold uppercase tracking-widest">
            Anicite
          </p>
          <h1 className="mt-2 text-lg font-semibold">Complete setup</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Finish the onboarding to start tracking your browsing activity.
          </p>
          <button
            className="btn btn-primary mt-5 w-full"
            onClick={() =>
              chrome.tabs.create({
                url: chrome.runtime.getURL('onboarding.html'),
              })
            }
            type="button"
          >
            Continue setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground w-[320px] p-4 text-sm">
      <div className="space-y-3">
        {!settings.enabled && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Tracking paused
              </p>
            </div>
            <button
              className="text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
              onClick={() =>
                chrome.tabs.create({
                  url: chrome.runtime.getURL('options.html'),
                })
              }
              type="button"
            >
              Resume
            </button>
          </div>
        )}
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest">
                Anicite
              </p>
              <h1 className="text-lg font-semibold">Today</h1>
            </div>
            <div className="-mr-1 flex items-center gap-0.5">
              <button
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1.5 transition-colors"
                onClick={() =>
                  chrome.tabs.create({
                    url: chrome.runtime.getURL('insights.html'),
                  })
                }
                title="Insights"
                type="button"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1.5 transition-colors"
                onClick={() =>
                  chrome.tabs.create({
                    url: chrome.runtime.getURL('options.html'),
                  })
                }
                title="Settings"
                type="button"
              >
                <SettingsIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Active</p>
                <p className="font-semibold">
                  {formatDuration(todayTotals.activeMs)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                <Eye className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Visits</p>
                <p className="font-semibold">{todayTotals.visits}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                <SwatchBook className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Sessions</p>
                <p className="font-semibold">{todayTotals.sessions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                <Globe className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Sites</p>
                <p className="font-semibold">{todayTotals.sitesCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-muted-foreground text-xs leading-none">
                  Active site
                </p>
                {isExcluded && (
                  <span className="text-destructive text-[10px] leading-none">
                    Excluded
                  </span>
                )}
              </div>
              <p className="font-semibold">
                {currentHost ?? (isLoading ? 'Loading...' : 'No active tab')}
              </p>
              {currentHost && (
                <button
                  className="text-muted-foreground hover:text-foreground mt-0.5 text-[10px] hover:underline"
                  onClick={async () => {
                    const newExcludeHosts = isExcluded
                      ? settings.excludeHosts.filter((h) => h !== currentHost)
                      : [...settings.excludeHosts, currentHost];
                    const next = await updateSettings({
                      excludeHosts: newExcludeHosts,
                    });
                    setSettings(next);
                  }}
                  type="button"
                >
                  {isExcluded ? 'Include this site' : 'Exclude this site'}
                </button>
              )}
            </div>
            {currentHost && (
              <div className="relative inline-flex shrink-0">
                <span
                  className={`h-2 w-2 shrink-0 self-center rounded-full ${CATEGORY_COLORS[currentCategory].bg}`}
                />
                <select
                  className={`appearance-none bg-transparent py-0.5 pl-1.5 pr-4 text-xs font-medium outline-none ${CATEGORY_COLORS[currentCategory].text}`}
                  value={currentCategory}
                  onChange={(e) =>
                    void handleCategoryChange(e.target.value as Category)
                  }
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORIES[cat].label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`pointer-events-none absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 ${CATEGORY_COLORS[currentCategory].text}`}
                />
              </div>
            )}
          </div>

          {currentKey ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Time</p>
                  <p className="font-semibold">
                    {formatDuration(stats.activeMs)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                  <MousePointerClick className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Clicks</p>
                  <p className="font-semibold">{stats.clicks}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                  <MoveVertical className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    Scroll
                    <ScrollIntensityTooltip />
                  </p>
                  {(() => {
                    const intensity = getScrollIntensity(
                      stats.scrollDistance,
                      stats.activeMs
                    );
                    return (
                      <p className="font-semibold">
                        <span className={getScrollIntensityColor(intensity)}>
                          {formatScrollIntensity(intensity)}
                        </span>
                        <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">
                          /min
                        </span>
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Switches</p>
                  <p className="font-semibold">{stats.tabSwitches}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Open a site to see this tab's stats.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
