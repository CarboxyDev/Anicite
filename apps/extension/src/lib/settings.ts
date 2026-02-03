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
  dataGranularity: 'path',
  onboarding: {
    consentConfirmed: false,
    privacyReviewed: false,
    pinExtension: false,
  },
};

export function normalizeHost(input: string): string {
  return input.trim().toLowerCase();
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
