# Feature Roadmap

Post-MVP UX improvements for Anicite.


### 4. Weekly Comparison (82/100)

"This week vs last week" comparison view in insights.

**Features:**
- Side-by-side or percentage change display
- Highlight significant changes (±20%+)
- Available for all key metrics

**Implementation notes:**
- Aggregate current 7 days vs previous 7 days
- Show delta with color coding (green = improvement based on context)

---

## Medium Impact

### 5. Focus Score / Health Metrics (78/100)

Derived composite score indicating browsing health.

**Factors:**
- Scroll intensity (high = negative)
- Session fragmentation (many short sessions = distracted)
- Category balance (productive vs entertainment ratio)
- Tab switch frequency

**Implementation notes:**
- Calculate on-demand in insights
- Show trend over time
- Provide actionable tips based on score

---

### 6. Daily/Weekly Goals (75/100)

Set time limits or targets per site or category.

**Features:**
- "Max 30min on twitter.com"
- "Min 2h on github.com"
- Progress shown in popup and insights
- Optional notification when approaching/exceeding

**Implementation notes:**
- Add `goals: Goal[]` to settings
- Goal structure: `{ target: string, type: 'max' | 'min', minutes: number, period: 'day' | 'week' }`

---

### 7. Insights in Popup (72/100)

Quick trends without opening full insights page.

**Features:**
- Mini sparkline for today's activity
- "vs yesterday" quick comparison
- Trend indicator (up/down arrow with percentage)

**Implementation notes:**
- Keep popup lightweight
- Fetch last 2 days of data only
- Simple SVG sparkline or text-based comparison

---

### 8. Empty States & Zero-Data UX (70/100)

Proper handling when no data exists for a period.

**Features:**
- Friendly empty state illustrations/messages
- Helpful prompts ("Start browsing to see your stats")
- Graceful degradation for partial data

**Implementation notes:**
- Audit all data-dependent components
- Create reusable EmptyState component
- Different messages based on context (new user vs no data for period)

---

## Nice-to-Have

### 9. Keyboard Shortcuts (55/100)

Power-user accessibility.

**Shortcuts:**
- Toggle tracking on/off
- Open insights
- Exclude/include current site
- Quick export

**Implementation notes:**
- Use Chrome commands API for global shortcuts
- Document shortcuts in settings

---

### 10. Data Retention Settings (50/100)

Auto-delete old data to manage storage growth.

**Features:**
- "Keep data for X days/months"
- Manual cleanup for specific date ranges
- Storage usage indicator

**Implementation notes:**
- Background job on extension load
- Prune `byDate` entries older than threshold
- Recalculate `totals` after pruning (or keep totals separate)

---

### 11. Achievement System (45/100)

Gamification for engagement.

**Milestones:**
- "First week tracked"
- "10 hours of focus time"
- "7-day streak"
- "Reduced social media by 50%"

**Implementation notes:**
- Store `achievements: string[]` in settings
- Check conditions on data update
- Toast notification on unlock

---

### 12. Notification/Reminder System (40/100)

Optional alerts and summaries.

**Features:**
- Daily summary notification
- "You've been on X for 1 hour" alerts
- Weekly email digest (requires future account system)

**Implementation notes:**
- Chrome notifications API
- Respect user preferences (off by default)
- Throttle to avoid annoyance
