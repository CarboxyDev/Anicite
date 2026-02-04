import {
  Clock,
  Eye,
  Globe,
  Settings as SettingsIcon,
  SwatchBook,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatDuration } from '../../lib/format';
import {
  aggregateByPeriod,
  type AggregatedStats,
  type Period,
} from '../../lib/insights';
import { getStore } from '../../lib/storage';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'all', label: 'All Time' },
];

export function App() {
  const [period, setPeriod] = useState<Period>('7days');
  const [data, setData] = useState<AggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const store = await getStore();
      const aggregated = aggregateByPeriod(store, period);
      setData(aggregated);
      setIsLoading(false);
    };
    void loadData();
  }, [period]);

  const maxDayMs =
    data?.byDate.reduce((max, d) => Math.max(max, d.stats.activeMs), 0) ?? 0;
  const maxSiteMs = data?.topSites[0]?.stats.activeMs ?? 0;

  if (isLoading && !data) {
    return (
      <div className="bg-background text-foreground min-h-screen px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <header className="mb-10">
            <div className="bg-muted h-3 w-16 animate-pulse rounded" />
            <div className="bg-muted mt-3 h-7 w-32 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
          </header>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="bg-muted h-5 w-24 animate-pulse rounded" />
                <div className="bg-muted mt-4 h-20 w-full animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest">
                Anicite
              </p>
              <h1 className="mt-2 text-2xl font-semibold">Insights</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Your browsing activity at a glance.
              </p>
            </div>
            <button
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-2 transition-colors"
              onClick={() =>
                chrome.tabs.create({
                  url: chrome.runtime.getURL('options.html'),
                })
              }
              title="Settings"
              type="button"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="mb-6 flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`btn btn-sm ${period === p.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(p.value)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <section className="card">
            <h2 className="text-sm font-semibold">Overview</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Active</p>
                  <p className="text-lg font-semibold">
                    {formatDuration(data?.totals.activeMs ?? 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Visits</p>
                  <p className="text-lg font-semibold">
                    {data?.totals.visits ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <SwatchBook className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Sessions</p>
                  <p className="text-lg font-semibold">
                    {data?.totals.sessions ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Sites</p>
                  <p className="text-lg font-semibold">
                    {data?.totals.sitesCount ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="text-sm font-semibold">Daily Activity</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Active time per day
            </p>
            {data && data.byDate.length > 0 ? (
              <div className="mt-4 space-y-2">
                {data.byDate.map((day) => {
                  const pct =
                    maxDayMs > 0 ? (day.stats.activeMs / maxDayMs) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex items-center gap-3 text-xs"
                    >
                      <span className="text-muted-foreground w-8 shrink-0">
                        {day.label}
                      </span>
                      <div className="bg-muted h-5 flex-1 overflow-hidden rounded">
                        <div
                          className="bg-primary h-full rounded transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 shrink-0 text-right font-medium">
                        {formatDuration(day.stats.activeMs)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                No activity data for this period.
              </p>
            )}
          </section>

          <section className="card">
            <h2 className="text-sm font-semibold">Top Sites</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Ranked by active time
            </p>
            {data && data.topSites.length > 0 ? (
              <div className="mt-4 space-y-3">
                {data.topSites.map((site, index) => {
                  const pct =
                    maxSiteMs > 0 ? (site.stats.activeMs / maxSiteMs) * 100 : 0;
                  return (
                    <div key={site.key} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-muted-foreground w-5 shrink-0 text-xs">
                            {index + 1}.
                          </span>
                          <span className="truncate font-medium">
                            {site.host}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                          <span>{formatDuration(site.stats.activeMs)}</span>
                          <span>{site.stats.visits}v</span>
                        </div>
                      </div>
                      <div className="ml-7">
                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                          <div
                            className="bg-primary/60 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                No sites tracked for this period.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
