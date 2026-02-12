<div align="center">
  <img src="assets/icon.svg" alt="Anicite Logo" width="100" />
</div>

# Anicite

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install%20Now-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/anicite/hjdggofcfojlkcmlheakdphkcfchjnam)

A Chrome extension for local-only analytics of your browsing activity. Understand your habits without compromising your privacy.

## What is this?

Anicite tracks how you spend time browsing - page visits, active time, clicks, scrolling, tab switches, and more It presents your insights through clean visualizations like donut charts, heatmaps, and daily activity bars. All data stays in your browser. Nothing leaves your machine.

## Key Features

- **Fully local** - all data is stored in Chrome's local storage, it never leaves your device
- **Privacy-first** - no query strings or hash fragments saved, no incognito access, full control over exporting and clearing your data
- **Rich insights** - time-by-category donut charts, hourly heatmaps, daily activity bars, top sites and more
- **Smart categorization** - built-in site categories (Productive, Social, Entertainment, Shopping, Reference) with user customizable options
- **Flexible tracking** - choose between focused or visible time tracking modes

## Installation

### From the Chrome Web Store

[Install Anicite from the Chrome Web Store](https://chromewebstore.google.com/detail/anicite/hjdggofcfojlkcmlheakdphkcfchjnam)

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
