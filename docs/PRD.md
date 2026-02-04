**Overview**

- Product: Anicite Chrome extension for local-only, consent-first analytics of browsing activity.
- Audience: individuals who want habit insights without sending data to a server.
- Positioning: modern, minimal UI with transparent privacy controls and open-source trust.
- Platforms: Chrome only for now; Chromium browsers later if low-effort.

**Problem**

- Users lack a trustworthy, local-first way to understand browsing habits and improve focus.
- Existing trackers often feel opaque or over-collecting, reducing adoption.

**Goals**

- Capture useful, high-signal metrics with minimal friction.
- Make privacy choices obvious and reversible.
- Create a data model that scales into future AI insights.

**Non-Goals (V1)**

- No cloud sync or multi-device data.
- No AI insights or server-side processing.
- No required account/login.

**Primary Use Cases**

- See daily activity summary and time spent per site.
- Exclude sensitive sites quickly.
- Reset local data at any time.

**MVP Features**

- Onboarding checklist with explicit consent confirmation.
- Tracking of visits, active time, clicks, and max scroll depth.
- Per-site exclusions.
- Local data clear.
- Minimal toolbar popup with quick status and link to options.
- Options page as primary configuration surface.

**Tracking Details (V1)**

- Visit counted on page load.
- Active time measured via visibility state.
- Clicks counted via document click events.
- Max scroll depth tracked as percentage.

**Data & Storage**

- Storage: `chrome.storage.local` only.
- Granularity: host + path only; no query strings or hash fragments.
- Aggregation: per-day rollups plus lifetime totals.
- Versioned local store for forward-compatible migrations.

**Privacy & Trust**

- Explicit consent required before meaningful use.
- No background uploads, no third-party scripts.
- Clear explanations of what is stored and how to delete it.
- Open-source codebase to allow auditing.

**UX & UI**

- Options page: onboarding checklist, exclusions, privacy summary, data clear.
- Popup: minimal snapshot and a link to options.
- Tone: modern, neutral, non-alarmist, no "v1" messaging.
- Theme: zinc-based light/dark, minimal gradients.

**Permissions**

- `storage`, `tabs`, and `host_permissions` for `<all_urls>`.
- Rationale: needed for local storage and tab URL tracking.

**Success Metrics**

- Onboarding completion rate.
- % users adding exclusions.
- Daily active tracking time captured.
- Low uninstall rate tied to privacy concerns.

**Risks**

- Perceived over-collection reduces adoption.
- Storage growth if tracking expands too fast.
- Edge cases with tab lifecycle / BFCache.

**Future Scope**

- Local insights and trends (weekly summaries).
- Account-based sync and web dashboard.
- AI analysis on opted-in data.

**Open Questions**

- Should host-only mode be offered later as an optional privacy setting?
- Which metrics are most valuable in the first dashboard view?
