import type { ContentScriptDefinition } from 'wxt';
import { defineContentScript } from 'wxt/sandbox';

import { MINDFUL_COOLDOWN_BYPASS_KEY, SETTINGS_KEY } from '../lib/constants';
import { getLocalDateKey, getLocalHourKey } from '../lib/date';
import type { PingMessage, PingResponse } from '../lib/messaging';
import { sendUpdateStats } from '../lib/messaging';
import {
  getMindfulCooldownRule,
  isHostExcluded,
  type MindfulProceedMode,
} from '../lib/settings';
import { getSettings, getStore } from '../lib/storage';
import { getUrlParts } from '../lib/url';

const FLUSH_INTERVAL_MS = 5000;
const SESSION_GAP_MS = 30 * 60 * 1000;
const MIN_COOLDOWN_SECONDS = 1;
const MAX_COOLDOWN_SECONDS = 300;
const MIN_BYPASS_MINUTES = 1;
const MAX_BYPASS_MINUTES = 1440;

type MindfulBypassStore = Record<string, number>;

function isContextValid(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getCooldownSeconds(value: number, fallback: number): number {
  const candidate = Number.isFinite(value) ? value : fallback;
  return clampInt(candidate, MIN_COOLDOWN_SECONDS, MAX_COOLDOWN_SECONDS);
}

function getBypassMinutes(value: number, fallback: number): number {
  const candidate = Number.isFinite(value) ? value : fallback;
  return clampInt(candidate, MIN_BYPASS_MINUTES, MAX_BYPASS_MINUTES);
}

function formatBypassWindow(minutes: number): string {
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

async function getMindfulBypassStore(): Promise<MindfulBypassStore> {
  const result = await chrome.storage.local.get(MINDFUL_COOLDOWN_BYPASS_KEY);
  const raw = result[MINDFUL_COOLDOWN_BYPASS_KEY];
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const parsed: MindfulBypassStore = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      parsed[key] = value;
    }
  }
  return parsed;
}

async function setMindfulBypass(
  host: string,
  timestamp: number
): Promise<void> {
  const store = await getMindfulBypassStore();
  store[host] = timestamp;
  await chrome.storage.local.set({ [MINDFUL_COOLDOWN_BYPASS_KEY]: store });
}

function isBypassActive(
  store: MindfulBypassStore,
  host: string,
  bypassMinutes: number
): boolean {
  const lastCompletedAt = store[host];
  if (!lastCompletedAt) return false;
  const bypassWindowMs = bypassMinutes * 60 * 1000;
  return Date.now() - lastCompletedAt < bypassWindowMs;
}

async function waitForBody(): Promise<void> {
  if (document.body) return;
  await new Promise<void>((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), {
      once: true,
    });
  });
}

async function runMindfulCooldownGate(
  _host: string,
  cooldownSeconds: number,
  bypassMinutes: number,
  proceedMode: MindfulProceedMode,
  autoProceed: boolean
): Promise<boolean> {
  await waitForBody();
  if (!document.body) {
    return false;
  }

  const existing = document.getElementById('anicite-mindful-cooldown-overlay');
  if (existing) {
    existing.remove();
  }

  return new Promise<boolean>((resolve) => {
    const HOLD_TO_CONTINUE_MS = 750;
    const AUTO_PROCEED_DELAY_MS = 350;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    const overlay = document.createElement('div');
    overlay.id = 'anicite-mindful-cooldown-overlay';
    const style = document.createElement('style');
    style.textContent = `
      #anicite-mindful-cooldown-overlay,
      #anicite-mindful-cooldown-overlay * {
        box-sizing: border-box;
      }
      #anicite-mindful-cooldown-overlay {
        --overlay-bg: rgba(255, 255, 255, 0.7);
        --card-bg: oklch(0.994 0 0 / 0.96);
        --card-fg: oklch(0 0 0);
        --card-muted: oklch(0.4386 0 0 / 0.8);
        --card-subtle: oklch(0.4386 0 0 / 0.58);
        --card-border: oklch(0.93 0.0094 286.2156);
        --track-bg: oklch(0.94 0 0);
        --fill-bg: oklch(0.5393 0.2713 286.7462);
        --btn-bg: oklch(0.954 0.0063 255.4755);
        --btn-fg: oklch(0.1344 0 0 / 0.72);
        --btn-border: oklch(0.93 0.0094 286.2156);
        --btn-ready-bg: oklch(0.5393 0.2713 286.7462 / 0.16);
        --btn-ready-fg: oklch(0.1344 0 0);
        --btn-ready-border: oklch(0.5393 0.2713 286.7462 / 0.45);
        --btn-ready-hover-bg: oklch(0.5393 0.2713 286.7462 / 0.22);
        --kicker-bg: oklch(0.9393 0.0288 266.368);
        --kicker-fg: oklch(0.5445 0.1903 259.4848);
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        padding: 20px;
        background: var(--overlay-bg);
        backdrop-filter: blur(8px);
        font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      @media (prefers-color-scheme: dark) {
        #anicite-mindful-cooldown-overlay {
          --overlay-bg: rgba(12, 16, 24, 0.72);
          --card-bg: oklch(0.2568 0.0076 274.6528 / 0.96);
          --card-fg: oklch(0.9551 0 0);
          --card-muted: oklch(0.7058 0 0 / 0.82);
          --card-subtle: oklch(0.7058 0 0 / 0.65);
          --card-border: oklch(0.3289 0.0092 268.3843);
          --track-bg: oklch(0.3289 0.0092 268.3843);
          --fill-bg: oklch(0.6132 0.2294 291.7437);
          --btn-bg: oklch(0.294 0.013 272.9312);
          --btn-fg: oklch(0.9551 0 0 / 0.74);
          --btn-border: oklch(0.3289 0.0092 268.3843);
          --btn-ready-bg: oklch(0.6132 0.2294 291.7437 / 0.2);
          --btn-ready-fg: oklch(0.9551 0 0);
          --btn-ready-border: oklch(0.6132 0.2294 291.7437 / 0.48);
          --btn-ready-hover-bg: oklch(0.6132 0.2294 291.7437 / 0.28);
          --kicker-bg: oklch(0.2795 0.0368 260.031);
          --kicker-fg: oklch(0.7857 0.1153 246.6596);
        }
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-card {
        width: min(460px, calc(100vw - 28px));
        border-radius: 22px;
        border: 1px solid var(--card-border);
        background: var(--card-bg);
        box-shadow: 0 28px 56px rgba(0, 0, 0, 0.36);
        padding: 28px 24px 22px;
        color: var(--card-fg);
        text-align: center;
        animation: aniciteCooldownIn 180ms ease-out;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-kicker {
        margin: 0 auto;
        width: fit-content;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--kicker-fg);
        background: var(--kicker-bg);
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-title {
        margin: 16px 0 0;
        font-size: 30px;
        line-height: 1.1;
        letter-spacing: -0.03em;
        font-weight: 700;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-subtitle {
        margin: 8px 0 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--card-muted);
        min-height: 42px;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-breath {
        margin: 20px 0 0;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--fill-bg);
        min-height: 18px;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-time {
        margin: 8px 0 0;
        font-size: 78px;
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.04em;
        font-variant-numeric: tabular-nums;
        font-family: "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        min-height: 78px;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-unit {
        margin: 4px 0 0;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--card-subtle);
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-progress {
        margin-top: 18px;
        width: 100%;
        height: 8px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--track-bg);
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-progress-fill {
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: var(--fill-bg);
        transform-origin: left center;
        transform: scaleX(0);
        will-change: transform;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-hint {
        margin: 12px 0 0;
        font-size: 12px;
        color: var(--card-muted);
        min-height: 34px;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button {
        width: 100%;
        height: 48px;
        border: 1px solid var(--btn-border);
        border-radius: 12px;
        outline: none;
        background: var(--btn-bg);
        color: var(--btn-fg);
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.01em;
        transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
        cursor: not-allowed;
        position: relative;
        overflow: hidden;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button-wrap {
        margin-top: 18px;
        width: 100%;
        height: 48px;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button-progress {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0;
        background: var(--fill-bg);
        transform-origin: left center;
        transform: scaleX(0);
        transition: opacity 120ms ease;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button-label {
        position: relative;
        z-index: 1;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button[data-state="ready-hold"][data-holding="true"] .anicite-cooldown-button-progress {
        opacity: 0.28;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button[data-state="ready-click"],
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button[data-state="ready-hold"] {
        background: var(--btn-ready-bg);
        color: var(--btn-ready-fg);
        border-color: var(--btn-ready-border);
        cursor: pointer;
      }
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button[data-state="ready-click"]:hover,
      #anicite-mindful-cooldown-overlay .anicite-cooldown-button[data-state="ready-hold"]:hover {
        background: var(--btn-ready-hover-bg);
      }
      @keyframes aniciteCooldownIn {
        from { opacity: 0; transform: translateY(8px) scale(0.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (max-width: 540px) {
        #anicite-mindful-cooldown-overlay .anicite-cooldown-card {
          padding: 24px 18px 18px;
          border-radius: 18px;
        }
        #anicite-mindful-cooldown-overlay .anicite-cooldown-title {
          font-size: 26px;
        }
        #anicite-mindful-cooldown-overlay .anicite-cooldown-time {
          font-size: 64px;
        }
      }
    `;

    const panel = document.createElement('div');
    panel.className = 'anicite-cooldown-card';

    const kicker = document.createElement('div');
    kicker.className = 'anicite-cooldown-kicker';
    kicker.textContent = 'Mindful Pause';

    const title = document.createElement('h1');
    title.className = 'anicite-cooldown-title';
    title.textContent = 'Pause for a moment';

    const subtitle = document.createElement('p');
    subtitle.className = 'anicite-cooldown-subtitle';
    subtitle.textContent =
      'Look away from the screen and take one slow breath.';

    const breath = document.createElement('p');
    breath.className = 'anicite-cooldown-breath';

    const time = document.createElement('p');
    time.className = 'anicite-cooldown-time';

    const unit = document.createElement('p');
    unit.className = 'anicite-cooldown-unit';
    unit.textContent = 'seconds';

    const progress = document.createElement('div');
    progress.className = 'anicite-cooldown-progress';

    const progressFill = document.createElement('div');
    progressFill.className = 'anicite-cooldown-progress-fill';
    progress.appendChild(progressFill);

    const hint = document.createElement('p');
    hint.className = 'anicite-cooldown-hint';
    hint.textContent = `You won't see this again for ${formatBypassWindow(bypassMinutes)} after continuing.`;

    const button = document.createElement('button');
    button.className = 'anicite-cooldown-button';
    button.type = 'button';
    button.disabled = true;
    button.dataset.holding = 'false';

    const buttonProgress = document.createElement('div');
    buttonProgress.className = 'anicite-cooldown-button-progress';

    const buttonLabel = document.createElement('span');
    buttonLabel.className = 'anicite-cooldown-button-label';
    buttonLabel.textContent = 'Pause in progress...';

    button.appendChild(buttonProgress);
    button.appendChild(buttonLabel);

    const buttonWrap = document.createElement('div');
    buttonWrap.className = 'anicite-cooldown-button-wrap';
    buttonWrap.appendChild(button);

    panel.appendChild(kicker);
    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(breath);
    panel.appendChild(time);
    panel.appendChild(unit);
    panel.appendChild(progress);
    panel.appendChild(hint);
    panel.appendChild(buttonWrap);

    overlay.appendChild(style);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    let raf = 0;
    let holdRaf = 0;
    let holdStartAt = 0;
    let autoProceedTimeout: number | undefined;
    let canContinue = false;
    const durationMs = cooldownSeconds * 1000;
    const startedAt = performance.now();
    const initialSeconds = String(cooldownSeconds);

    time.textContent = initialSeconds;
    breath.textContent = 'Inhale slowly';
    progressFill.style.transform = 'scaleX(0)';
    buttonProgress.style.transform = 'scaleX(0)';

    const cleanup = () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
      if (holdRaf) {
        cancelAnimationFrame(holdRaf);
      }
      if (autoProceedTimeout !== undefined) {
        window.clearTimeout(autoProceedTimeout);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      button.removeEventListener('click', handleContinue);
      button.removeEventListener('pointerdown', handleHoldStart);
      button.removeEventListener('pointerup', handleHoldEnd);
      button.removeEventListener('pointerleave', handleHoldEnd);
      button.removeEventListener('pointercancel', handleHoldEnd);
      button.removeEventListener('keydown', handleHoldKeyDown);
      button.removeEventListener('keyup', handleHoldKeyUp);
      overlay.remove();
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };

    const finish = (completed: boolean) => {
      cleanup();
      resolve(completed);
    };

    const handleBeforeUnload = () => {
      finish(false);
    };

    const handleContinue = () => {
      if (!canContinue || autoProceed || proceedMode === 'hold') return;
      finish(true);
    };

    const resetHold = () => {
      holdStartAt = 0;
      if (holdRaf) {
        cancelAnimationFrame(holdRaf);
      }
      holdRaf = 0;
      button.dataset.holding = 'false';
      buttonProgress.style.transform = 'scaleX(0)';
    };

    const tickHold = () => {
      if (!canContinue || proceedMode !== 'hold' || holdStartAt === 0) {
        return;
      }

      const elapsed = performance.now() - holdStartAt;
      const holdProgress = Math.min(1, elapsed / HOLD_TO_CONTINUE_MS);
      buttonProgress.style.transform = `scaleX(${holdProgress})`;

      if (holdProgress >= 1) {
        finish(true);
        return;
      }

      holdRaf = requestAnimationFrame(tickHold);
    };

    const handleHoldStart = () => {
      if (
        !canContinue ||
        autoProceed ||
        proceedMode !== 'hold' ||
        holdStartAt !== 0
      ) {
        return;
      }
      holdStartAt = performance.now();
      button.dataset.holding = 'true';
      holdRaf = requestAnimationFrame(tickHold);
    };

    const handleHoldEnd = () => {
      if (
        !canContinue ||
        autoProceed ||
        proceedMode !== 'hold' ||
        holdStartAt === 0
      ) {
        return;
      }
      resetHold();
    };

    const handleHoldKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      handleHoldStart();
    };

    const handleHoldKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      handleHoldEnd();
    };

    const handleTick = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      const remainingSeconds = Math.max(
        0,
        Math.ceil((durationMs - elapsed) / 1000)
      );

      const breathPhase = Math.floor(elapsed / 2000) % 2 === 0;
      breath.textContent = breathPhase ? 'Inhale slowly' : 'Exhale slowly';
      time.textContent = String(remainingSeconds);
      progressFill.style.transform = `scaleX(${progress})`;

      if (progress < 1) {
        raf = requestAnimationFrame(handleTick);
        return;
      }

      canContinue = true;
      breath.textContent = 'Pause complete';
      hint.textContent = `Cooldown complete. This pause stays off for ${formatBypassWindow(bypassMinutes)}.`;

      if (autoProceed) {
        button.disabled = true;
        buttonLabel.textContent = 'Continuing...';
        button.setAttribute('data-state', 'auto');
        button.dataset.holding = 'false';
        buttonProgress.style.transform = 'scaleX(0)';
        autoProceedTimeout = window.setTimeout(() => {
          finish(true);
        }, AUTO_PROCEED_DELAY_MS);
        return;
      }

      button.disabled = false;
      if (proceedMode === 'hold') {
        buttonLabel.textContent = 'Press and hold to continue';
        button.setAttribute('data-state', 'ready-hold');
        button.dataset.holding = 'false';
        buttonProgress.style.transform = 'scaleX(0)';
      } else {
        buttonLabel.textContent = 'Continue';
        button.setAttribute('data-state', 'ready-click');
        button.dataset.holding = 'false';
        buttonProgress.style.transform = 'scaleX(0)';
      }
    };

    button.addEventListener('click', handleContinue);
    button.addEventListener('pointerdown', handleHoldStart);
    button.addEventListener('pointerup', handleHoldEnd);
    button.addEventListener('pointerleave', handleHoldEnd);
    button.addEventListener('pointercancel', handleHoldEnd);
    button.addEventListener('keydown', handleHoldKeyDown);
    button.addEventListener('keyup', handleHoldKeyUp);

    window.addEventListener('beforeunload', handleBeforeUnload, { once: true });
    raf = requestAnimationFrame(handleTick);
  });
}

const contentScript: ContentScriptDefinition = defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  async main() {
    if (!isContextValid()) return;

    let settings;
    try {
      settings = await getSettings();
    } catch {
      return;
    }

    const hasConsent = settings.onboarding.consentConfirmed;
    if (!hasConsent) return;

    let enabled = settings.enabled;
    let excludeHosts = settings.excludeHosts;
    let trackingMode = settings.trackingMode;
    const mindfulCooldown = settings.mindfulCooldown;
    const dataGranularity = settings.dataGranularity;

    let urlParts = getUrlParts(window.location.href, dataGranularity);

    if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) return;

    const mindfulMatch = mindfulCooldown.enabled
      ? getMindfulCooldownRule(urlParts.host, mindfulCooldown.sites)
      : null;

    if (mindfulMatch) {
      const cooldownSeconds = getCooldownSeconds(
        mindfulMatch.rule.cooldownSeconds,
        mindfulCooldown.defaultCooldownSeconds
      );
      const bypassMinutes = getBypassMinutes(
        mindfulMatch.rule.bypassMinutes,
        mindfulCooldown.defaultBypassMinutes
      );

      try {
        const bypassStore = await getMindfulBypassStore();
        const shouldBypass = isBypassActive(
          bypassStore,
          mindfulMatch.host,
          bypassMinutes
        );
        if (!shouldBypass) {
          const completed = await runMindfulCooldownGate(
            mindfulMatch.host,
            cooldownSeconds,
            bypassMinutes,
            mindfulCooldown.proceedMode,
            mindfulCooldown.autoProceed
          );
          if (!completed) {
            return;
          }
          await setMindfulBypass(mindfulMatch.host, Date.now());
        }
      } catch (error) {
        void error;
      }
    }

    let stopped = false;
    let intervalId: number | undefined;
    let flushInProgress = false;
    let navigationInProgress = false;

    let activeMs = 0;
    let windowFocused = document.hasFocus();
    const shouldTrackNow =
      document.visibilityState === 'visible' &&
      (trackingMode === 'visible' || windowFocused);
    let lastActiveAt = shouldTrackNow ? Date.now() : null;
    let clicks = 0;
    let scrollDistance = 0;
    let lastScrollY = window.scrollY;
    let tabSwitches = 0;

    let lastFlushedActiveMs = 0;
    let lastFlushedClicks = 0;
    let lastFlushedTabSwitches = 0;
    let lastFlushedScrollDistance = 0;

    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };

    const updateScrollDistance = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);
      if (delta > 0 && window.innerHeight > 0) {
        scrollDistance += delta / window.innerHeight;
      }
      lastScrollY = currentScrollY;
    };

    const flush = async (isUnload = false) => {
      if (stopped || !isContextValid()) {
        stop();
        return;
      }

      if (flushInProgress && !isUnload) return;
      flushInProgress = true;

      // Fallback URL change detection for browsers without Navigation API
      if (!navigationInProgress && !isUnload) {
        const currentUrlParts = getUrlParts(
          window.location.href,
          dataGranularity
        );
        if (currentUrlParts.key !== urlParts.key) {
          flushInProgress = false;
          void handleUrlChange();
          return;
        }
      }

      if (!enabled || isHostExcluded(urlParts.host, excludeHosts)) {
        flushInProgress = false;
        return;
      }

      const now = Date.now();

      const shouldBeTracking =
        document.visibilityState === 'visible' &&
        (trackingMode === 'visible' || windowFocused);
      if (shouldBeTracking && !lastActiveAt) {
        lastActiveAt = now;
      }

      const totalActiveMs = lastActiveAt
        ? activeMs + (now - lastActiveAt)
        : activeMs;
      const deltaActiveMs = Math.max(0, totalActiveMs - lastFlushedActiveMs);
      const deltaClicks = Math.max(0, clicks - lastFlushedClicks);
      const deltaTabSwitches = Math.max(
        0,
        tabSwitches - lastFlushedTabSwitches
      );
      const deltaScrollDistance = Math.max(
        0,
        scrollDistance - lastFlushedScrollDistance
      );

      if (
        deltaActiveMs === 0 &&
        deltaClicks === 0 &&
        deltaTabSwitches === 0 &&
        deltaScrollDistance === 0
      ) {
        flushInProgress = false;
        return;
      }

      const prevFlushedActiveMs = lastFlushedActiveMs;
      const prevFlushedClicks = lastFlushedClicks;
      const prevFlushedTabSwitches = lastFlushedTabSwitches;
      const prevFlushedScrollDistance = lastFlushedScrollDistance;

      lastFlushedActiveMs = totalActiveMs;
      lastFlushedClicks = clicks;
      lastFlushedTabSwitches = tabSwitches;
      lastFlushedScrollDistance = scrollDistance;

      try {
        const response = await sendUpdateStats({
          key: urlParts.key,
          url: urlParts.url,
          host: urlParts.host,
          path: urlParts.path,
          dateKey: getLocalDateKey(),
          hourKey: getLocalHourKey(),
          delta: {
            activeMs: deltaActiveMs,
            clicks: deltaClicks,
            scrollDistance: deltaScrollDistance,
            tabSwitches: deltaTabSwitches,
          },
        });

        if (!response.success) {
          lastFlushedActiveMs = prevFlushedActiveMs;
          lastFlushedClicks = prevFlushedClicks;
          lastFlushedTabSwitches = prevFlushedTabSwitches;
          lastFlushedScrollDistance = prevFlushedScrollDistance;

          if (
            response.error?.includes('Extension context invalidated') ||
            response.error?.includes('Receiving end does not exist')
          ) {
            stop();
          }
        }
      } catch {
        lastFlushedActiveMs = prevFlushedActiveMs;
        lastFlushedClicks = prevFlushedClicks;
        lastFlushedTabSwitches = prevFlushedTabSwitches;
        lastFlushedScrollDistance = prevFlushedScrollDistance;
        stop();
      } finally {
        flushInProgress = false;
      }
    };

    const handleVisibilityChange = () => {
      if (stopped) return;
      const now = Date.now();

      if (document.visibilityState === 'hidden') {
        if (lastActiveAt) {
          activeMs += now - lastActiveAt;
          lastActiveAt = null;
        }
        tabSwitches += 1;
        void flush();
      } else {
        const shouldTrack = trackingMode === 'visible' || windowFocused;
        if (!lastActiveAt && shouldTrack) {
          lastActiveAt = now;
        }
      }
    };

    const handleFocus = () => {
      windowFocused = true;
      if (stopped || trackingMode !== 'focused') return;
      if (!lastActiveAt && document.visibilityState === 'visible') {
        lastActiveAt = Date.now();
      }
    };

    const handleBlur = () => {
      windowFocused = false;
      if (stopped || trackingMode !== 'focused') return;
      if (lastActiveAt) {
        activeMs += Date.now() - lastActiveAt;
        lastActiveAt = null;
      }
    };

    const resetMetrics = () => {
      if (lastActiveAt) {
        lastActiveAt = null;
      }
      activeMs = 0;
      clicks = 0;
      scrollDistance = 0;
      tabSwitches = 0;
      lastFlushedActiveMs = 0;
      lastFlushedClicks = 0;
      lastFlushedScrollDistance = 0;
      lastFlushedTabSwitches = 0;
    };

    const handleUrlChange = async () => {
      if (stopped || navigationInProgress) return;

      const newUrlParts = getUrlParts(window.location.href, dataGranularity);

      if (newUrlParts.key === urlParts.key) return;

      navigationInProgress = true;

      try {
        if (lastActiveAt) {
          activeMs += Date.now() - lastActiveAt;
          lastActiveAt = null;
        }
        await flush();

        urlParts = newUrlParts;
        resetMetrics();

        if (!enabled || isHostExcluded(newUrlParts.host, excludeHosts)) {
          return;
        }

        if (
          document.visibilityState === 'visible' &&
          (trackingMode === 'visible' || windowFocused)
        ) {
          lastActiveAt = Date.now();
        }

        let store;
        try {
          store = await getStore();
        } catch {
          store = null;
        }

        const existingPage = store?.pages[newUrlParts.key];
        const now = Date.now();
        const isNewSession =
          !existingPage || now - existingPage.lastSeenAt > SESSION_GAP_MS;

        try {
          await sendUpdateStats({
            key: newUrlParts.key,
            url: newUrlParts.url,
            host: newUrlParts.host,
            path: newUrlParts.path,
            dateKey: getLocalDateKey(),
            hourKey: getLocalHourKey(),
            delta: {
              visits: 1,
              sessions: isNewSession ? 1 : 0,
            },
          });
        } catch {
          // Failed to record visit for new URL
        }
      } finally {
        navigationInProgress = false;
      }
    };

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (stopped || areaName !== 'local') return;
      const next = changes[SETTINGS_KEY]?.newValue;
      if (!next) return;

      const newEnabled = Boolean(next.enabled);
      const newExcludeHosts = next.excludeHosts ?? [];
      const wasExcluded =
        !enabled || isHostExcluded(urlParts.host, excludeHosts);
      const isNowExcluded =
        !newEnabled || isHostExcluded(urlParts.host, newExcludeHosts);

      if (isNowExcluded && !wasExcluded) {
        resetMetrics();
      } else if (!isNowExcluded && wasExcluded) {
        resetMetrics();
        if (
          document.visibilityState === 'visible' &&
          (next.trackingMode === 'visible' || windowFocused)
        ) {
          lastActiveAt = Date.now();
        }
      }

      enabled = newEnabled;
      excludeHosts = newExcludeHosts;
      trackingMode = next.trackingMode ?? 'focused';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    window.addEventListener('pagehide', () => {
      if (lastActiveAt) {
        activeMs += Date.now() - lastActiveAt;
        lastActiveAt = null;
      }
      void flush(true);
    });

    document.addEventListener('click', () => {
      if (!stopped) clicks += 1;
    });

    window.addEventListener('scroll', updateScrollDistance, { passive: true });

    // SPA navigation detection via Navigation API (Chrome 102+)
    // Use 'currententrychange' which fires for all same-document navigations
    // including pushState/replaceState (unlike 'navigatesuccess' which only
    // fires for full navigations)
    const nav = (globalThis as { navigation?: EventTarget }).navigation;
    if (nav && typeof nav.addEventListener === 'function') {
      nav.addEventListener('currententrychange', () => {
        void handleUrlChange();
      });
    }

    // Fallback: popstate for back/forward navigation
    window.addEventListener('popstate', () => {
      void handleUrlChange();
    });

    intervalId = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    try {
      chrome.storage.onChanged.addListener(handleStorageChange);
    } catch {
      stop();
      return;
    }

    const handlePing = (
      message: PingMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: PingResponse) => void
    ) => {
      if (message.type === 'PING') {
        sendResponse({ active: !stopped });
        return true;
      }
      return false;
    };

    try {
      chrome.runtime.onMessage.addListener(handlePing);
    } catch {
      stop();
      return;
    }

    let store;
    try {
      store = await getStore();
    } catch {
      stop();
      return;
    }

    const existingPage = store.pages[urlParts.key];
    const now = Date.now();
    const isNewSession =
      !existingPage || now - existingPage.lastSeenAt > SESSION_GAP_MS;

    try {
      const response = await sendUpdateStats({
        key: urlParts.key,
        url: urlParts.url,
        host: urlParts.host,
        path: urlParts.path,
        dateKey: getLocalDateKey(),
        hourKey: getLocalHourKey(),
        delta: {
          visits: 1,
          sessions: isNewSession ? 1 : 0,
        },
      });

      if (!response.success) {
        stop();
        return;
      }
    } catch {
      stop();
      return;
    }

    updateScrollDistance();

    window.addEventListener('beforeunload', () => {
      if (lastActiveAt) {
        activeMs += Date.now() - lastActiveAt;
        lastActiveAt = null;
      }
      void flush(true);
      stop();
    });
  },
});

export default contentScript;
