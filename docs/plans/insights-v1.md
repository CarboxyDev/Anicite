# Insights Page V1

## Overview

A full-page view showing historical browsing trends and top sites. Complements the minimal popup (today only) with deeper analysis.

**Name**: "Insights" - lighter feel than "Dashboard", matches PRD future scope

## V1 Features

### 1. Period Selector
Tabs: Today | Last 7 Days | Last 30 Days | All Time

### 2. Overview Card
4-metric grid for selected period:
- Total active time
- Total visits
- Total sessions
- Unique sites count

### 3. Daily Activity
CSS-only horizontal bar chart:
- Shows daily active time
- Last 7 or 14 days depending on period
- Day labels (Mon, Tue, etc.)

### 4. Top Sites
Ranked list (top 10 by active time):
- Site name (host)
- Active time + progress bar
- Visit count

## UI Layout

```
┌─────────────────────────────────────────────────┐
│  Anicite                              [Settings]│
│  Insights                                       │
├─────────────────────────────────────────────────┤
│  [Today] [7 Days] [30 Days] [All Time]          │
├─────────────────────────────────────────────────┤
│  Overview                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐│
│  │ Active   │ │ Visits   │ │ Sessions │ │Sites││
│  │ 4h 32m   │ │ 142      │ │ 38       │ │ 23  ││
│  └──────────┘ └──────────┘ └──────────┘ └─────┘│
├─────────────────────────────────────────────────┤
│  Daily Activity                                 │
│  Mon  ████████████████████  2h 15m              │
│  Tue  ███████████  1h 05m                       │
│  Wed  ████████████████  1h 45m                  │
│  Thu  ████████  58m                             │
│  Fri  ██████████████████████████  3h 02m        │
│  Sat  ███████  48m                              │
│  Sun  ██████████████  1h 28m                    │
├─────────────────────────────────────────────────┤
│  Top Sites                                      │
│  1. github.com       ████████████  1h 23m  45v  │
│  2. docs.google.com  ████████  52m  28v         │
│  3. twitter.com      ██████  38m  67v           │
│  4. stackoverflow.com ████  25m  12v            │
│  5. youtube.com      ███  18m  8v               │
└─────────────────────────────────────────────────┘
```

## File Structure

```
apps/extension/src/
├── entrypoints/
│   └── insights/           # NEW
│       ├── index.html      # HTML shell
│       ├── main.tsx        # React entry (copy from options)
│       └── App.tsx         # Main component
└── lib/
    └── insights.ts         # NEW - data aggregation utilities
```

## New Types

```typescript
type Period = 'today' | '7days' | '30days' | 'all';

type AggregatedStats = {
  totals: StatsTotals & { sitesCount: number };
  byDate: Array<{ date: string; label: string; stats: StatsTotals }>;
  topSites: Array<{
    key: string;
    host: string;
    stats: StatsTotals;
  }>;
};
```

## Key Functions (lib/insights.ts)

```typescript
// Get date keys for a period
function getDateKeysForPeriod(period: Period): string[]

// Aggregate all data for a period
function aggregateByPeriod(store: Store, period: Period): AggregatedStats

// Get day label from date key
function getDayLabel(dateKey: string): string // "Mon", "Tue", etc.
```

## Navigation Access Points

1. **Popup header**: Icon button next to Settings gear
2. **Options page**: Link in Data section "View Insights →"

Opens via: `chrome.tabs.create({ url: chrome.runtime.getURL('insights.html') })`

## Implementation Order

1. Create `lib/insights.ts` - aggregation utilities
2. Create `entrypoints/insights/` - page structure
3. Build Overview section
4. Build Top Sites section
5. Build Daily Activity section
6. Add popup navigation button
7. Add options page link

## Edge Cases

- **Empty state**: Show friendly message when no data for period
- **Long site names**: Truncate with ellipsis
- **Large datasets**: Consider memoization if slow
- **Timezone**: Use existing getLocalDateKey() for consistency

## Not in V1 (Future)

- Click site for detail view
- Data export (CSV/JSON)
- Hourly breakdown
- Category grouping
- Goals and focus mode
- Comparison between periods
