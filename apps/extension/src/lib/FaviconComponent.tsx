import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getFavicon } from './favicon';

type FaviconProps = {
  host: string;
  size?: number;
  className?: string;
};

/**
 * Favicon component that displays a site's favicon with a fallback Globe icon.
 */
export function Favicon({ host, size = 16, className = '' }: FaviconProps) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadFavicon = async () => {
      setIsLoading(true);
      setHasError(false);

      const url = await getFavicon(host);

      if (!cancelled) {
        setFaviconUrl(url);
        setIsLoading(false);
        if (!url) setHasError(true);
      }
    };

    void loadFavicon();

    return () => {
      cancelled = true;
    };
  }, [host]);

  const iconSize = size;
  const iconClasses = `shrink-0 ${className}`;

  // Show fallback Globe icon during loading or on error
  if (isLoading || hasError || !faviconUrl) {
    return (
      <div
        className={`flex items-center justify-center ${iconClasses}`}
        style={{ width: iconSize, height: iconSize }}
      >
        <Globe
          className="text-muted-foreground"
          style={{ width: iconSize * 0.85, height: iconSize * 0.85 }}
        />
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      className={`rounded-sm ${iconClasses}`}
      style={{ width: iconSize, height: iconSize }}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
