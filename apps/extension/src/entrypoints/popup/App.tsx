import { useEffect, useMemo, useState } from 'react';

import { getLocalDateKey } from '../../lib/date';
import { formatDuration } from '../../lib/format';
import {
  DEFAULT_SETTINGS,
  isHostExcluded,
  type Settings,
} from '../../lib/settings';
import { getSettings, getStore, type StatsTotals } from '../../lib/storage';
import { getUrlParts } from '../../lib/url';

const DEFAULT_STATS: StatsTotals = {
  visits: 0,
  activeMs: 0,
  clicks: 0,
  scrollMax: 0,
};

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentHost, setCurrentHost] = useState<string | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsTotals>(DEFAULT_STATS);
  const [todayTotals, setTodayTotals] = useState<StatsTotals>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  const isExcluded = useMemo(() => {
    if (!currentHost) {
      return false;
    }
    return isHostExcluded(currentHost, settings.excludeHosts);
  }, [currentHost, settings.excludeHosts]);

  const onboardingProgress = useMemo(() => {
    const total = Object.keys(settings.onboarding).length;
    const completed = Object.values(settings.onboarding).filter(Boolean).length;
    return { total, completed, isComplete: completed === total };
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

        const totals = { ...DEFAULT_STATS };
        for (const entry of Object.values(store.pages)) {
          const day = entry.byDate[dateKey];
          if (!day) {
            continue;
          }
          totals.visits += day.visits;
          totals.activeMs += day.activeMs;
          totals.clicks += day.clicks;
          totals.scrollMax = Math.max(totals.scrollMax, day.scrollMax);
        }
        setTodayTotals(totals);
      }

      setIsLoading(false);
    };

    void init();
  }, []);

  return (
    <div className="relative min-h-screen w-[360px] p-4 pb-16 text-sm">
      <div className="space-y-3">
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-brand-500 text-xs uppercase tracking-[0.2em]">
                Anicite
              </p>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Today
              </h1>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                onboardingProgress.isComplete
                  ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
              }`}
            >
              {onboardingProgress.completed}/{onboardingProgress.total} done
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Active</p>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {formatDuration(todayTotals.activeMs)}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Visits</p>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {todayTotals.visits}
              </p>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active site
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {currentHost ?? (isLoading ? 'Loading…' : 'No active tab')}
            </p>
            {isExcluded && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Excluded from tracking
              </p>
            )}
          </div>

          {currentKey ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Time</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatDuration(stats.activeMs)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Clicks</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.clicks}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Open a site to see this tab’s stats.
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex items-center justify-between gap-3">
          <button
            className="text-brand-600 dark:text-brand-300 text-xs font-semibold"
            onClick={() => chrome.runtime.openOptionsPage()}
            type="button"
          >
            Options
          </button>
          <button
            className="button-primary"
            onClick={() => window.close()}
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
