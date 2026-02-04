# Tracked Metrics

These metrics are currently collected by the extension.

## Core Metrics

| Metric | Type | Description |
|--------|------|-------------|
| **visits** | count | Incremented once per page load |
| **sessions** | count | New session if >30min since last visit to same page |
| **activeMs** | milliseconds | Time the tab was visible (not background) |
| **clicks** | count | Document-level click events |
| **scrollMax** | ratio (0-1) | Deepest scroll depth reached on page |
| **tabSwitches** | count | Times user switched away from the tab |

## Aggregation

- **Per-day**: Each metric stored under `byDate[YYYY-MM-DD]`
- **Lifetime**: Cumulative totals in `totals`
- **scrollMax**: Stores maximum value (not sum)

## Storage Keys

- Data: `anicite:data`
- Settings: `anicite:settings`

## Granularity Modes

| Mode | Key Format | Example |
|------|------------|---------|
| `path` (default) | `host/path` | `github.com/user/repo` |
| `host` | `host` | `github.com` |

## Implementation Details

- Flush interval: 10 seconds
- Session gap threshold: 30 minutes
- No query strings or hash fragments stored
- Path limited to 180 characters
