import type { Category } from './categories';

export type DataGranularity = 'host' | 'path';

export type TrackingMode = 'focused' | 'visible';

export type OnboardingState = {
  consentConfirmed: boolean;
  privacyReviewed: boolean;
  pinExtension: boolean;
};

export type MindfulCooldownRule = {
  cooldownSeconds: number;
  bypassMinutes: number;
};

export type MindfulProceedMode = 'hold' | 'click';

export type MindfulCooldownSettings = {
  enabled: boolean;
  defaultCooldownSeconds: number;
  defaultBypassMinutes: number;
  proceedMode: MindfulProceedMode;
  autoProceed: boolean;
  sites: Record<string, MindfulCooldownRule>;
};

export type Settings = {
  enabled: boolean;
  excludeHosts: string[];
  dataGranularity: DataGranularity;
  trackingMode: TrackingMode;
  onboarding: OnboardingState;
  siteCategories: Record<string, Category>;
  mindfulCooldown: MindfulCooldownSettings;
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  excludeHosts: [],
  dataGranularity: 'path',
  trackingMode: 'focused',
  onboarding: {
    consentConfirmed: false,
    privacyReviewed: false,
    pinExtension: false,
  },
  siteCategories: {},
  mindfulCooldown: {
    enabled: false,
    defaultCooldownSeconds: 10,
    defaultBypassMinutes: 15,
    proceedMode: 'hold',
    autoProceed: false,
    sites: {},
  },
};

export function normalizeHost(input: string): string {
  let host = input.trim().toLowerCase();
  host = host.replace(/^(https?:\/\/)?(www\.)?/, '');
  host = host.replace(/\/.*$/, '');
  return host;
}

export function isValidHost(input: string): boolean {
  const host = normalizeHost(input);
  if (!host || host.includes(' ')) {
    return false;
  }
  if (host === 'localhost' || host.startsWith('localhost:')) {
    return true;
  }
  const domainRegex =
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  return domainRegex.test(host);
}

export function normalizeHostList(hosts: string[]): string[] {
  return Array.from(new Set(hosts.map(normalizeHost).filter(Boolean)));
}

export function isHostExcluded(host: string, excludeHosts: string[]): boolean {
  const normalized = normalizeHost(host);
  return excludeHosts.some((excluded) => {
    const candidate = normalizeHost(excluded);
    return normalized === candidate || normalized.endsWith(`.${candidate}`);
  });
}

export function getMindfulCooldownRule(
  host: string,
  siteRules: Record<string, MindfulCooldownRule>
): { host: string; rule: MindfulCooldownRule } | null {
  const normalized = normalizeHost(host);
  let best: { host: string; rule: MindfulCooldownRule } | null = null;

  for (const [configuredHost, rule] of Object.entries(siteRules)) {
    const candidate = normalizeHost(configuredHost);
    if (!candidate) continue;
    if (normalized !== candidate && !normalized.endsWith(`.${candidate}`)) {
      continue;
    }
    if (!best || candidate.length > best.host.length) {
      best = { host: candidate, rule };
    }
  }

  return best;
}
