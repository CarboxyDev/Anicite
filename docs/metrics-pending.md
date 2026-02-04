# Pending Metrics

Metrics considered for future versions.

## High Value (Recommended)

| Metric | Description | Why |
|--------|-------------|-----|
| **timeOfDay** | Hour buckets (0-23) with time spent | Reveals morning vs night patterns |
| **referrerHost** | Domain that led to this page | Understand traffic sources (search, social, direct) |
| **bounceFlag** | True if activeMs < 5s AND clicks = 0 | Identify pages with low engagement |

## Medium Value

| Metric | Description | Why |
|--------|-------------|-----|
| **focusLost** | Count of window blur events | Measures multitasking/distraction |
| **idleTime** | Time visible but no interaction | Distinguishes passive vs active viewing |
| **keystrokes** | Count of typing events | Indicates form/input engagement |

## Low Priority

| Metric | Description | Why |
|--------|-------------|-----|
| **mediaPlayed** | Video/audio play events | Media consumption tracking |
| **linkClicks** | Navigation link clicks | Understand browsing flow |
| **formSubmits** | Form submission count | Interaction depth |

## Privacy Considerations

All pending metrics follow the same principles:
- No content captured (URLs only, no text)
- No PII collected
- User can exclude any host
- All data stays local


