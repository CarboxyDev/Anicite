import type { DataGranularity } from './settings';

export type UrlParts = {
  url: string;
  host: string;
  path?: string;
  key: string;
};

export function getHostname(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
}

function sanitizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }
  const trimmed = pathname.replace(/\/+$/u, '');
  const limited = trimmed.length > 180 ? `${trimmed.slice(0, 180)}…` : trimmed;
  return limited.startsWith('/') ? limited : `/${limited}`;
}

export function getUrlParts(
  rawUrl: string,
  granularity: DataGranularity
): UrlParts {
  const parsed = new URL(rawUrl);
  const host = parsed.hostname.toLowerCase();
  const path = sanitizePath(parsed.pathname);

  if (granularity === 'host') {
    return {
      url: host,
      host,
      key: host,
    };
  }

  const url = `${host}${path}`;
  return {
    url,
    host,
    path,
    key: url,
  };
}
