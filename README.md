<div align="center">
  <img src="assets/icon.svg" alt="Anicite Logo" width="200" />
</div>

# Anicite

A Chrome extension for local-only, consent-first analytics of your browsing activity. Understand your habits without sending data anywhere.

## What is this?

Anicite tracks how you spend time browsing -- page visits, active time, clicks, scrolling, tab switches, and sessions -- and presents it through clean visualizations like donut charts, heatmaps, and daily activity bars. All data stays in your browser using `chrome.storage.local`. Nothing leaves your machine.

## Key Features

- **Fully local** -- all data stored in Chrome's local storage, never transmitted
- **Rich insights** -- time-by-category donut charts, hourly heatmaps, daily activity bars, top sites
- **Smart categorization** -- built-in site categories (Productive, Social, Entertainment, Shopping, Reference) with user overrides
- **Flexible tracking** -- choose between host-only or path-level granularity, focused or visible time tracking modes
- **Privacy-first** -- no query strings or hash fragments saved, no incognito access, full data export/clear controls
- **Onboarding wizard** -- explains exactly what gets tracked and how to control it

## Installation

### From the Chrome Web Store

Coming soon.

### Build from source

Requires Node.js >= 20 and pnpm >= 9.

```bash
git clone https://github.com/CarboxyDev/anicite.git
cd anicite
pnpm install
pnpm build:extension
```

Then load the built extension in Chrome:

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `apps/extension/.output/chrome-mv3` directory

## Tech Stack

- WXT as the web extension framework (Manifest V3)
- React 19, Tailwind CSS, Lucide icons
- Chrome Storage API for local persistence

## License

MIT
