import {
  ArrowLeftRight,
  BarChart3,
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

import { SETTINGS_KEY, STORAGE_KEY } from '../../lib/constants';
import { getLocalDateKey } from '../../lib/date';
import { formatDuration } from '../../lib/format';
import type { PingResponse } from '../../lib/messaging';
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

function formatScrollIntensity(
  scrollDistance: number | undefined,
  activeMs: number
): string {
  const distance = scrollDistance ?? 0;
  const activeMinutes = activeMs / 60000;
  if (activeMinutes < 0.1) return '–';
  const intensity = distance / activeMinutes;
  if (!Number.isFinite(intensity)) return '–';
  return intensity.toFixed(1);
}

function ScrollIntensityTooltip() {
  return (
    <div className="group relative inline-flex">
      <Info className="group-hover:text-foreground h-2.5 w-2.5 cursor-help transition-colors" />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="bg-foreground text-background w-max max-w-[200px] rounded-md px-3 py-2 text-xs shadow-lg">
          <p className="mb-1.5 font-medium">Scroll intensity</p>
          <div className="space-y-0.5 text-[11px] opacity-90">
            <p>
              <span className="text-green-400">&lt; 1</span> Reading/watching
            </p>
            <p>
              <span className="text-yellow-400">1-5</span> Normal browsing
            </p>
            <p>
              <span className="text-red-400">5+</span> Doom scrolling
            </p>
          </div>
        </div>
        <div className="bg-foreground mx-auto h-2 w-2 -translate-y-1 rotate-45 rounded-sm" />
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
  const [isTracking, setIsTracking] = useState(false);
  const currentKeyRef = useRef<string | null>(null);

  const isExcluded = useMemo(() => {
    if (!currentHost) {
      return false;
    }
    return isHostExcluded(currentHost, settings.excludeHosts);
  }, [currentHost, settings.excludeHosts]);

  const isOnboardingComplete = useMemo(() => {
    return Object.values(settings.onboarding).every(Boolean);
  }, [settings.onboarding]);

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

        try {
          const response = await chrome.tabs.sendMessage<
            { type: 'PING' },
            PingResponse
          >(tab.id, { type: 'PING' });
          setIsTracking(response?.active ?? false);
        } catch {
          setIsTracking(false);
        }
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
                {isTracking && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 self-center rounded-full bg-green-500"
                    title="Tracking active"
                  />
                )}
                {isExcluded && (
                  <span className="text-destructive text-[10px] leading-none">
                    Excluded
                  </span>
                )}
              </div>
              <p className="font-semibold">
                {currentHost ?? (isLoading ? 'Loading...' : 'No active tab')}
              </p>
            </div>
            {currentHost && (
              <button
                className="text-muted-foreground hover:text-foreground shrink-0 text-xs hover:underline"
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
                {isExcluded ? 'Include' : 'Exclude'}
              </button>
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
                  <p className="font-semibold">
                    {formatScrollIntensity(
                      stats.scrollDistance,
                      stats.activeMs
                    )}
                    <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">
                      /min
                    </span>
                  </p>
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
