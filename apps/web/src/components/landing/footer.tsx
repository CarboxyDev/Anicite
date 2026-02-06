import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="border-border border-t px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-xs font-bold">A</span>
          </div>
          <span className="text-foreground font-semibold">
            {siteConfig.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            GitHub
          </a>
          <a
            href={siteConfig.chromeWebStore}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Chrome Web Store
          </a>
          <a
            href="#privacy"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Privacy
          </a>
        </div>

        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} {siteConfig.name}. Built by{' '}
          <a
            href="https://carboxy.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary font-medium transition-colors"
          >
            CarboxyDev
          </a>
          . Open source under MIT.
        </p>
      </div>
    </footer>
  );
}
