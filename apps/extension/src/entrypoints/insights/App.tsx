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

import {
  CATEGORIES,
  type Category,
  getCategoryForHost,
} from '../../lib/categories';
import { SETTINGS_KEY, STORAGE_KEY } from '../../lib/constants';
import { formatDuration } from '../../lib/format';
import {
  aggregateByCategory,
  aggregateByHour,
  aggregateByPeriod,
  type AggregatedStats,
  type CategoryStats,
  type HourlyCell,
  type HourlyPatternData,
  type Period,
} from '../../lib/insights';
import { DEFAULT_SETTINGS, type Settings } from '../../lib/settings';
import { getSettings, getStore, type Store } from '../../lib/storage';

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

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  productive: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  social: { bg: 'bg-blue-500', text: 'text-blue-500' },
  entertainment: { bg: 'bg-purple-500', text: 'text-purple-500' },
  shopping: { bg: 'bg-amber-500', text: 'text-amber-500' },
  reference: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-500' },
  other: { bg: 'bg-zinc-400', text: 'text-zinc-400' },
};

const CATEGORY_SVG_COLORS: Record<Category, string> = {
  productive: '#10b981',
  social: '#3b82f6',
  entertainment: '#a855f7',
  shopping: '#f59e0b',
  reference: '#d946ef',
  other: '#a1a1aa',
};

function DonutChart({ data }: { data: CategoryStats[] }) {
  const size = 120;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    const result: {
      category: Category;
      length: number;
      offset: number;
      color: string;
    }[] = [];
    let currentOffset = 0;

    for (const item of data) {
      const length = (item.percentage / 100) * circumference;
      result.push({
        category: item.category,
        length,
        offset: currentOffset,
        color: CATEGORY_SVG_COLORS[item.category],
      });
      currentOffset += length;
    }

    return result;
  }, [data, circumference]);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted"
      />
      {segments.map((seg) => (
        <circle
          key={seg.category}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.length} ${circumference - seg.length}`}
          strokeDashoffset={-seg.offset}
          className="transition-all duration-300"
        />
      ))}
    </svg>
  );
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
  return intensity.toFixed(1) + '/min';
}

function EmptyState({ period }: { period: Period }) {
  const message =
    period === 'today'
      ? 'Start browsing to see your activity for today.'
      : 'No activity recorded for this period.';

  return <p className="text-muted-foreground mt-4 text-sm">{message}</p>;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function HeatmapCell({
  cell,
  dayLabel,
}: {
  cell: HourlyCell;
  dayLabel: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`heatmap-cell heatmap-${cell.intensity} relative`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <div className="bg-popover text-popover-foreground border-border absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded border px-2 py-1 text-xs shadow-md">
          <div className="font-medium">
            {dayLabel} {formatHour(cell.hour)}
          </div>
          <div className="text-muted-foreground">
            {cell.stats.activeMs > 0
              ? formatDuration(cell.stats.activeMs)
              : 'No activity'}
          </div>
        </div>
      )}
    </div>
  );
}

function Heatmap({ data }: { data: HourlyPatternData }) {
  if (!data.hasData) {
    return (
      <p className="text-muted-foreground mt-4 text-sm">
        Hourly patterns will appear as you browse.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="mb-1 flex">
          <div className="w-9 shrink-0" />
          {[0, 3, 6, 9, 12, 15, 18, 21].map((hour, i) => (
            <div
              key={hour}
              className="text-muted-foreground text-[10px]"
              style={{ width: '36px' }}
            >
              {HOUR_LABELS[i]}
            </div>
          ))}
        </div>

        <div className="space-y-0.5">
          {DAY_LABELS.map((day, dayIndex) => (
            <div key={day} className="flex items-center">
              <div className="text-muted-foreground w-9 shrink-0 text-[10px]">
                {day}
              </div>
              <div className="flex gap-0.5">
                {data.grid[dayIndex].map((cell) => (
                  <HeatmapCell
                    key={`${dayIndex}-${cell.hour}`}
                    cell={cell}
                    dayLabel={day}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-muted-foreground mt-3 flex items-center justify-end gap-1 text-[10px]">
          <span>Less</span>
          <div className="heatmap-cell heatmap-none" />
          <div className="heatmap-cell heatmap-low" />
          <div className="heatmap-cell heatmap-medium" />
          <div className="heatmap-cell heatmap-high" />
          <div className="heatmap-cell heatmap-peak" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [period, setPeriod] = useState<Period>('today');
  const [sortBy, setSortBy] = useState<SortMetric>('time');
  const [data, setData] = useState<AggregatedStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyPatternData | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const periodRef = useRef<Period>('today');
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);

  const updateFromStore = useCallback((store: Store) => {
    const aggregated = aggregateByPeriod(store, periodRef.current);
    setData(aggregated);
    const catStats = aggregateByCategory(
      store,
      periodRef.current,
      settingsRef.current.siteCategories
    );
    setCategoryStats(catStats);
    const hourly = aggregateByHour(store, periodRef.current);
    setHourlyData(hourly);
  }, []);

  useEffect(() => {
    periodRef.current = period;
    const loadData = async () => {
      setIsLoading(true);
      const [store, loadedSettings] = await Promise.all([
        getStore(),
        getSettings(),
      ]);
      settingsRef.current = loadedSettings;
      setSettings(loadedSettings);
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

      if (changes[SETTINGS_KEY]?.newValue) {
        const newSettings = changes[SETTINGS_KEY].newValue as Settings;
        settingsRef.current = newSettings;
        setSettings(newSettings);
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
            <div className="card">
              <div className="bg-muted h-4 w-28 animate-pulse rounded" />
              <div className="bg-muted mt-1 h-3 w-44 animate-pulse rounded" />
              <div className="mt-4 space-y-1">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="bg-muted h-3 w-8 animate-pulse rounded" />
                    <div className="bg-muted h-3 flex-1 animate-pulse rounded" />
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

          {categoryStats.length > 0 && (
            <section className="card">
              <h2 className="text-sm font-semibold">Time by Category</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Activity breakdown by site category
              </p>
              <div className="mt-4 flex items-start gap-6">
                <DonutChart data={categoryStats} />
                <div className="flex-1 space-y-2">
                  {categoryStats.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_COLORS[cat.category].bg}`}
                      />
                      <span className="min-w-[80px] font-medium">
                        {CATEGORIES[cat.category].label}
                      </span>
                      <span className="text-muted-foreground">
                        {cat.percentage.toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground ml-auto">
                        {formatDuration(cat.stats.activeMs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="card">
            <h2 className="text-sm font-semibold">Hourly Patterns</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              When you're most active during the week
            </p>
            {hourlyData && <Heatmap data={hourlyData} />}
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
                  const category = getCategoryForHost(
                    site.host,
                    settings.siteCategories
                  );
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
                          <span
                            className={`flex shrink-0 items-center gap-1 text-[10px] ${CATEGORY_COLORS[category].text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${CATEGORY_COLORS[category].bg}`}
                            />
                            {CATEGORIES[category].label}
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
