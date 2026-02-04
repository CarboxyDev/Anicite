import {
  ArrowLeftRight,
  Clock,
  Eye,
  Globe,
  MousePointerClick,
  MoveVertical,
  Settings as SettingsIcon,
  SwatchBook,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  updateSettings,
} from '../../lib/storage';
import { getUrlParts } from '../../lib/url';

const DEFAULT_STATS: StatsTotals = {
  visits: 0,
  sessions: 0,
  activeMs: 0,
  clicks: 0,
  scrollMax: 0,
  tabSwitches: 0,
};

interface TodayTotals extends StatsTotals {
  sitesCount: number;
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

  const isExcluded = useMemo(() => {
    if (!currentHost) {
      return false;
    }
    return isHostExcluded(currentHost, settings.excludeHosts);
  }, [currentHost, settings.excludeHosts]);

  const isOnboardingComplete = useMemo(() => {
    return Object.values(settings.onboarding).every(Boolean);
  }, [settings.onboarding]);

  useEffect(() => {
    const init = async () => {
      const storedSettings = await getSettings();
      setSettings(storedSettings);

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        const urlParts = getUrlParts(tab.url, storedSettings.dataGranularity);
        setCurrentHost(urlParts.host);
        setCurrentKey(urlParts.key);

        const store = await getStore();
        const page = store.pages[urlParts.key];
        const dateKey = getLocalDateKey();
        setStats(page?.byDate[dateKey] ?? DEFAULT_STATS);

        const totals: TodayTotals = { ...DEFAULT_STATS, sitesCount: 0 };
        for (const entry of Object.values(store.pages)) {
          const day = entry.byDate[dateKey];
          if (!day) {
            continue;
          }
          totals.visits += day.visits;
          totals.sessions += day.sessions;
          totals.activeMs += day.activeMs;
          totals.clicks += day.clicks;
          totals.tabSwitches += day.tabSwitches;
          totals.scrollMax = Math.max(totals.scrollMax, day.scrollMax);
          totals.sitesCount += 1;
        }
        setTodayTotals(totals);
      }

      setIsLoading(false);
    };

    void init();
  }, []);

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
            <button
              className="text-muted-foreground hover:text-foreground hover:bg-muted -mr-1 rounded-md p-1.5 transition-colors"
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
              <p className="text-muted-foreground text-xs">Active site</p>
              <p className="font-semibold">
                {currentHost ?? (isLoading ? 'Loading...' : 'No active tab')}
              </p>
              {isExcluded && (
                <p className="text-destructive text-xs">
                  Excluded from tracking
                </p>
              )}
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
                  <p className="text-muted-foreground text-[11px]">Scrolled</p>
                  <p className="font-semibold">
                    {Math.round(stats.scrollMax * 100)}%
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
