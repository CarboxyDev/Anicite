import { Settings as SettingsIcon } from 'lucide-react';
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
              onClick={() => chrome.runtime.openOptionsPage()}
              title="Settings"
              type="button"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Active</p>
              <p className="text-base font-semibold">
                {formatDuration(todayTotals.activeMs)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Visits</p>
              <p className="text-base font-semibold">{todayTotals.visits}</p>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div>
            <p className="text-muted-foreground text-xs">Active site</p>
            <p className="font-semibold">
              {currentHost ?? (isLoading ? 'Loading...' : 'No active tab')}
            </p>
            {isExcluded && (
              <p className="text-destructive text-xs">Excluded from tracking</p>
            )}
          </div>

          {currentKey ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-semibold">
                  {formatDuration(stats.activeMs)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Clicks</p>
                <p className="font-semibold">{stats.clicks}</p>
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
