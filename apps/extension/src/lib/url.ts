import type { DataGranularity } from './settings';

export type UrlParts = {
  url: string;
  host: string;
  path?: string;
  key: string;
};

function normalizeHostname(hostname: string): string {
  let h = hostname.toLowerCase();
  if (h.startsWith('www.')) {
    h = h.slice(4);
  }
  return h;
}

export function getHostname(rawUrl: string): string | null {
  try {
    return normalizeHostname(new URL(rawUrl).hostname);
  } catch {
    return null;
  }
}

const MAX_PATH_LENGTH = 180;

function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function sanitizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }
  const trimmed = pathname.replace(/\/+$/u, '');

  if (trimmed.length > MAX_PATH_LENGTH) {
    const hash = fnv1a(trimmed);
    // Keep enough characters to satisfy the limit but make room for the hash (8 chars) + ellipsis + brackets
    // Hash is usually 8 chars hex. ellipsis is 1. brackets 2. space 0.
    // Let's safe cut at MAX_PATH_LENGTH - 12
    const prefix = trimmed.slice(0, MAX_PATH_LENGTH - 12);
    const limited = `${prefix}…[${hash}]`;
    return limited.startsWith('/') ? limited : `/${limited}`;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function getUrlParts(
  rawUrl: string,
  granularity: DataGranularity
): UrlParts {
  const parsed = new URL(rawUrl);
  const host = normalizeHostname(parsed.hostname);
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
