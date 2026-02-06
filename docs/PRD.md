# Anicite - Product Requirements Document

**Updated: February 6, 2026**

---

## Overview

- **Product**: Anicite - A Chrome extension for local-only, consent-first analytics of browsing activity.
- **Audience**: Privacy-conscious individuals who want habit insights without sending data to any server.
- **Positioning**: Modern, minimal UI with transparent privacy controls and open-source trust.
- **Platforms**: Chrome only (Manifest V3); Chromium browsers supported via same build.

---

## Problem

- Users lack a trustworthy, local-first way to understand browsing habits and improve focus.
- Existing trackers often feel opaque, over-collecting, or sending data to third parties.
- No easy way to visualize browsing patterns (hourly/weekly heatmaps, category breakdowns).

---

## Goals

- Capture useful, high-signal metrics with minimal friction.
- Make privacy choices obvious and reversible.
- Provide rich insights through visualizations (donut charts, heatmaps, daily activity bars).
- Create a data model that scales into future AI insights.

---

## Non-Goals (V1)

- No cloud sync or multi-device data.
- No AI insights or server-side processing.
- No required account/login.
- No Firefox or Safari support (Chromium-only for now).

---

## Current Feature Set

### Core Tracking

| Feature | Status | Description |
|---------|--------|-------------|
| Page visits | ✅ | Counted on page load, SPA navigation detected via Navigation API |
| Active time | ✅ | Measured via visibility state and window focus |
| Clicks | ✅ | Counted via document click events |
| Scroll distance | ✅ | Tracked as screens scrolled (normalized by viewport height) |
| Tab switches | ✅ | Tracked when visibility changes to hidden |
| Sessions | ✅ | New session after 30-minute gap from last activity |

### Data Granularity Options

| Mode | Description |
|------|-------------|
| Host-only | Aggregates all paths under domain (youtube.com) |
| Path-level | Tracks individual pages (youtube.com/watch, youtube.com/shorts) - Default |

### Time Tracking Modes

| Mode | Description |
|------|-------------|
| Tab Focused | Only counts time when browser window is focused (default) |
| Tab Visible | Counts time when tab is visible, even if another app is focused |

### Site Categories

Built-in categorization with user overrides:

| Category | Color | Example Sites |
|----------|-------|---------------|
| Productive | Emerald | GitHub, Notion, Figma, Gmail, Vercel |
| Social | Blue | Twitter/X, Reddit, Discord, LinkedIn |
| Entertainment | Purple | YouTube, Netflix, Twitch, Spotify |
| Shopping | Amber | Amazon, eBay, Etsy |
| Reference | Fuchsia | Google, StackOverflow, Wikipedia, MDN |
| Other | Zinc | Uncategorized sites |

### UI Surfaces

#### 1. Popup (320px width)
- Today's quick stats (active time, visits, sessions, sites count)
- Current site stats (time, clicks, scroll intensity, tab switches)
- Favicon display for current site
- Category selector for current site
- Quick exclude/include toggle for current site
- Links to Insights and Settings pages
- Tracking paused warning banner

#### 2. Insights Page
- Period selector (Today / 7 Days / 30 Days / All Time)
- Overview cards (active time, visits, sessions, sites)
- **Time by Category** - Interactive donut chart with legend
- **Daily Activity** - Bar chart showing daily breakdown
- **Hourly Patterns** - Heatmap (weekly for 7+ days, hourly bar for Today)
- **Top Sites** - Paginated list with favicons and sorting options:
  - Active time
  - Clicks  
  - Scroll intensity
  - Tab switches
- Category filter chips for site list
- Expandable site details with all metrics

#### 3. Options/Settings Page
- Tracking toggle (enable/disable)
- Time tracking mode selector (focused vs visible)
- Excluded sites list with favicons and add/remove
- Site categories manager with favicons and search
- Data export (JSON/CSV) with date range selector
- Clear all data with confirmation
- Privacy summary section

#### 4. Onboarding Flow
- 3-step wizard explaining:
  1. Local-only data storage
  2. What gets tracked
  3. User control options
- Progress indicator
- Completion confirmation with "Get started" action

### Privacy & Data

| Feature | Implementation |
|---------|----------------|
| Storage | `chrome.storage.local` only |
| URL handling | Host + path only; query strings and hash fragments never saved |
| Path truncation | Long paths truncated to 180 chars with FNV-1a hash suffix |
| Aggregation | Per-day rollups + per-hour rollups + lifetime totals |
| Store version | Version 2 (migrated from v1 to add byHour data) |
| Incognito | Not allowed (`incognito: 'not_allowed'`) |

### Technical Architecture

| Component | Technology |
|-----------|------------|
| Framework | WXT (Web Extension Toolkit) with React |
| Styling | Tailwind CSS with custom component library |
| Font | Plus Jakarta Sans (self-hosted via @fontsource) |
| Icons | Lucide React |
| Theme | Light/dark mode with oklch color system |

### Permissions

| Permission | Rationale |
|------------|-----------|
| `storage` | Local data persistence |
| `http://*/*`, `https://*/*` | Content script injection for tracking |

---

## Design System

### Color Palette (oklch-based)

- **Primary**: Purple/violet accent
- **Background**: Near-white (light) / Zinc-900 (dark)
- **Cards**: Elevated surface with subtle shadow
- **Semantic colors**: Success (emerald), Destructive (red)

### Component Library

- Cards with consistent padding and border radius
- Button variants: primary, secondary, ghost, destructive, outline
- Form inputs with focus rings
- Toggle switches
- Badges (default, success, muted, primary)
- Heatmap cells with intensity levels (none, low, medium, high, peak)

---

## Changes from Original PRD

| Original PRD | Current Implementation | Notes |
|--------------|------------------------|-------|
| Max scroll depth as percentage | Scroll distance (screens scrolled per minute) | More useful metric for detecting "doom scrolling" |
| Minimal toolbar popup | Rich popup with stats and category selector | Enhanced popup UX |
| Options page as primary surface | Dedicated Insights page added | Better separation of concerns |
| Onboarding checklist | Step-through wizard | More polished experience |
| Per-site exclusions | Per-site exclusions + subdomain matching | Enhanced flexibility |
| N/A | Site categories with donut chart | New feature |
| N/A | Hourly heatmap/patterns | New feature |
| N/A | Tab switches tracking | New metric |
| N/A | Session tracking (30-min gap) | New metric |
| N/A | Data export (JSON/CSV) | New feature |
| N/A | Tracking mode (focused vs visible) | New option |
| N/A | Data granularity (host vs path) | New option |
| N/A | SPA navigation detection | Technical improvement |
| zinc-based light/dark | oklch-based color system | Modern color approach |

---

## Success Metrics

- Onboarding completion rate
- % users customizing categories
- Daily active tracking time captured
- % users using Insights page regularly
- Data export usage
- Low uninstall rate

---

## Known Limitations / Tech Debt

1. **Category management UX** - Limited to 20 visible sites in settings, rest need search
2. **Data cleanup** - No automatic cleanup of old data (storage could grow indefinitely)
3. **Backup/restore** - Export exists but no import functionality
4. **No notification/alerts** - No reminders for high usage
5. **Limited chart interactivity** - Daily chart not clickable for drill-down

---

## Future Scope

### Near-term
- Weekly summary/digest view
- Focus mode / blocking integration
- Time goals / budgets per category

### Medium-term
- Data import functionality
- Firefox extension port
- Customizable time periods (custom date ranges)
- Comparison views (this week vs last week)

### Long-term
- Account-based sync and web dashboard
- AI analysis on opted-in data
- Team/shared insights (for workplace use)

---

## Open Questions

- Automatic data pruning after X days?
- Goal/budget system for limiting time on specific categories?
- Weekly email digest option (would require optional email collection)?
