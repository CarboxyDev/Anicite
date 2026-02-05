import {
  ArrowLeftRight,
  ChevronDown,
  Clock,
  Eye,
  Globe,
  MousePointerClick,
  MoveVertical,
  Settings as SettingsIcon,
  SwatchBook,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import { STORAGE_KEY } from '../../lib/constants';
import { formatDuration } from '../../lib/format';
import {
  aggregateByPeriod,
  type AggregatedStats,
  type Period,
} from '../../lib/insights';
import { getStore, type Store } from '../../lib/storage';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'all', label: 'All Time' },
];

type SortMetric = 'time' | 'clicks' | 'scroll' | 'switches';

const SORT_OPTIONS: { value: SortMetric; label: string; icon: typeof Clock }[] =
  [
    { value: 'time', label: 'Active time', icon: Clock },
    { value: 'clicks', label: 'Clicks', icon: MousePointerClick },
    { value: 'scroll', label: 'Scroll intensity', icon: MoveVertical },
    { value: 'switches', label: 'Tab switches', icon: ArrowLeftRight },
  ];

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
  return intensity.toFixed(1) + '/min';
}

function EmptyState({ period }: { period: Period }) {
  const message =
    period === 'today'
      ? 'Start browsing to see your activity for today.'
      : 'No activity recorded for this period.';

  return <p className="text-muted-foreground mt-4 text-sm">{message}</p>;
}

export function App() {
  const [period, setPeriod] = useState<Period>('today');
  const [sortBy, setSortBy] = useState<SortMetric>('time');
  const [data, setData] = useState<AggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const periodRef = useRef<Period>('today');

  const updateFromStore = useCallback((store: Store) => {
    const aggregated = aggregateByPeriod(store, periodRef.current);
    setData(aggregated);
  }, []);

  useEffect(() => {
    periodRef.current = period;
    const loadData = async () => {
      setIsLoading(true);
      const store = await getStore();
      updateFromStore(store);
      setIsLoading(false);
    };
    void loadData();
  }, [period, updateFromStore]);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local') return;
      if (changes[STORAGE_KEY]?.newValue) {
        updateFromStore(changes[STORAGE_KEY].newValue as Store);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [updateFromStore]);

  const handlePeriodChange = (newPeriod: Period) => {
    startTransition(() => {
      setPeriod(newPeriod);
    });
  };

  const maxDayMs =
    data?.byDate.reduce((max, d) => Math.max(max, d.stats.activeMs), 0) ?? 0;

  const sortedSites = useMemo(() => {
    if (!data?.topSites) return [];

    const getSortValue = (site: (typeof data.topSites)[number]): number => {
      switch (sortBy) {
        case 'time':
          return site.stats.activeMs;
        case 'clicks':
          return site.stats.clicks;
        case 'scroll':
          return (
            getScrollIntensity(
              site.stats.scrollDistance,
              site.stats.activeMs
            ) ?? 0
          );
        case 'switches':
          return site.stats.tabSwitches;
        default:
          return site.stats.activeMs;
      }
    };

    return [...data.topSites].sort((a, b) => getSortValue(b) - getSortValue(a));
  }, [data, sortBy]);

  const maxSortValue = useMemo(() => {
    if (sortedSites.length === 0) return 0;
    const first = sortedSites[0];
    switch (sortBy) {
      case 'time':
        return first.stats.activeMs;
      case 'clicks':
        return first.stats.clicks;
      case 'scroll':
        return (
          getScrollIntensity(
            first.stats.scrollDistance,
            first.stats.activeMs
          ) ?? 0
        );
      case 'switches':
        return first.stats.tabSwitches;
      default:
        return first.stats.activeMs;
    }
  }, [sortedSites, sortBy]);

  const formatSortValue = (site: (typeof sortedSites)[number]): string => {
    switch (sortBy) {
      case 'time':
        return formatDuration(site.stats.activeMs);
      case 'clicks':
        return `${site.stats.clicks} clicks`;
      case 'scroll':
        return formatScrollIntensity(
          getScrollIntensity(site.stats.scrollDistance, site.stats.activeMs)
        );
      case 'switches':
        return `${site.stats.tabSwitches} switches`;
      default:
        return formatDuration(site.stats.activeMs);
    }
  };

  const getSiteProgress = (site: (typeof sortedSites)[number]): number => {
    if (maxSortValue === 0) return 0;
    switch (sortBy) {
      case 'time':
        return (site.stats.activeMs / maxSortValue) * 100;
      case 'clicks':
        return (site.stats.clicks / maxSortValue) * 100;
      case 'scroll': {
        const intensity =
          getScrollIntensity(site.stats.scrollDistance, site.stats.activeMs) ??
          0;
        return (intensity / maxSortValue) * 100;
      }
      case 'switches':
        return (site.stats.tabSwitches / maxSortValue) * 100;
      default:
        return (site.stats.activeMs / maxSortValue) * 100;
    }
  };

  if (isLoading && !data) {
    return (
      <div className="bg-background text-foreground min-h-screen px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <header className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                <div className="bg-muted mt-3 h-7 w-24 animate-pulse rounded" />
                <div className="bg-muted mt-2 h-4 w-52 animate-pulse rounded" />
              </div>
              <div className="bg-muted h-9 w-9 animate-pulse rounded-md" />
            </div>
          </header>
          <div className="mb-6 flex gap-1">
            {PERIODS.map((p) => (
              <div
                key={p.value}
                className="bg-muted h-8 w-16 animate-pulse rounded"
              />
            ))}
          </div>
          <div className="space-y-6">
            <div className="card">
              <div className="bg-muted h-4 w-20 animate-pulse rounded" />
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
                    <div>
                      <div className="bg-muted h-3 w-10 animate-pulse rounded" />
                      <div className="bg-muted mt-1 h-5 w-12 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="card">
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                <div className="bg-muted mt-1 h-3 w-32 animate-pulse rounded" />
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="bg-muted h-6 w-full animate-pulse rounded"
                    />
                  ))}
                </div>
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
              onClick={() => handlePeriodChange(p.value)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className={`space-y-6 transition-opacity duration-150 ${isPending ? 'opacity-60' : 'opacity-100'}`}
        >
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
                      <span className="text-muted-foreground w-10 shrink-0">
                        {day.label}
                      </span>
                      <div className="bg-muted h-5 flex-1 overflow-hidden rounded">
                        <div
                          className="bg-primary h-full rounded transition-all duration-300"
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
              <EmptyState period={period} />
            )}
          </section>

          <section className="card">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold">Top Sites</h2>
              <div className="relative">
                <select
                  className="text-muted-foreground hover:text-foreground appearance-none bg-transparent pr-5 text-xs font-medium outline-none transition-colors"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortMetric)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2" />
              </div>
            </div>
            {sortedSites.length > 0 ? (
              <div className="mt-4 space-y-3">
                {sortedSites.map((site, index) => {
                  const pct = getSiteProgress(site);
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
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {formatSortValue(site)}
                        </span>
                      </div>
                      <div className="ml-7">
                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState period={period} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
