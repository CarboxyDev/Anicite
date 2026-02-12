'use client';

import { Button } from '@repo/packages-ui/button';
import { ThemeToggle } from '@repo/packages-ui/theme-toggle';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { GitHubStarsButton } from '@/components/landing/github-stars-button';
import { siteConfig } from '@/config/site';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Showcase', href: '/#showcase' },
  { label: 'Privacy', href: '/#privacy' },
] as const;

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInstallCta, setShowInstallCta] = useState(false);
  const [isGithubCompact, setIsGithubCompact] = useState(false);

  useEffect(() => {
    const heroCta = document.getElementById('hero-add-to-chrome-cta');

    if (!heroCta) {
      setShowInstallCta(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowInstallCta(!entry.isIntersecting);
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(heroCta);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (showInstallCta) {
      setIsGithubCompact(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsGithubCompact(false);
    }, 240);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [showInstallCta]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <div className="flex justify-start">
          <a href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt={siteConfig.name} className="h-8 w-8" />
            <span className="text-foreground text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </a>
        </div>

        <nav className="hidden items-center justify-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <motion.div
            layout
            className="hidden items-center md:flex lg:hidden"
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            <AnimatePresence initial={false}>
              {showInstallCta ? (
                <motion.div
                  key="install-cta-md"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="inline-flex"
                >
                  <Button asChild className="h-9 px-4 font-semibold">
                    <a
                      href={siteConfig.chromeWebStore}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Add to Chrome
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
          <motion.div
            layout
            className="hidden items-center gap-2 lg:flex"
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            <motion.div
              layout
              className="inline-flex"
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              <GitHubStarsButton compact={isGithubCompact} />
            </motion.div>
            <AnimatePresence initial={false}>
              {showInstallCta ? (
                <motion.div
                  key="install-cta"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="inline-flex"
                >
                  <Button asChild className="h-9 px-4 font-semibold">
                    <a
                      href={siteConfig.chromeWebStore}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Add to Chrome
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-muted-foreground hover:text-foreground md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-border border-t md:hidden"
        >
          <div className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            {showInstallCta ? (
              <div className="mt-3">
                <Button asChild className="w-full justify-center font-semibold">
                  <a
                    href={siteConfig.chromeWebStore}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Add to Chrome
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
