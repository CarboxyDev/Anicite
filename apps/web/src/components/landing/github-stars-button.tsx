'use client';

import { GitHubIcon } from '@repo/packages-ui/icons/brand-icons';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { siteConfig } from '@/config/site';

function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
}

interface GitHubStarsButtonProps {
  compact?: boolean;
  className?: string;
}

function useStarCount() {
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/CarboxyDev/anicite', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setStarCount(data.stargazers_count))
      .catch(() => {});
  }, []);

  return starCount;
}

export function GitHubStarsButton({
  compact = false,
  className,
}: GitHubStarsButtonProps) {
  const starCount = useStarCount();

  return (
    <a
      href={siteConfig.github}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <span className="border-border bg-card hover:bg-accent inline-flex items-center rounded-lg border text-sm font-medium transition-colors">
        <span
          className={`flex items-center gap-2 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
        >
          <GitHubIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          {!compact && 'Star on GitHub'}
        </span>
        {starCount !== null && (
          <>
            <span className={`bg-border w-px ${compact ? 'h-5' : 'h-6'}`} />
            <span
              className={`flex items-center gap-1 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}
            >
              <Star
                className={`fill-yellow-400 text-yellow-400 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`}
              />
              {formatStarCount(starCount)}
            </span>
          </>
        )}
      </span>
    </a>
  );
}
