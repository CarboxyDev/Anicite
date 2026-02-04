export type DataGranularity = 'host' | 'path';

export type OnboardingState = {
  consentConfirmed: boolean;
  privacyReviewed: boolean;
  pinExtension: boolean;
};

export type Settings = {
  enabled: boolean;
  excludeHosts: string[];
  dataGranularity: DataGranularity;
  onboarding: OnboardingState;
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  excludeHosts: [],
  dataGranularity: 'host',
  onboarding: {
    consentConfirmed: false,
    privacyReviewed: false,
    pinExtension: false,
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
