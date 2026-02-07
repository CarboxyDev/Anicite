'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, HardDrive, Shield, Trash2, WifiOff } from 'lucide-react';
import Link from 'next/link';

import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { siteConfig } from '@/config/site';

const HIGHLIGHTS = [
  {
    icon: HardDrive,
    title: '100% local storage',
    description:
      'Your data never leaves your device. Everything is stored in chrome storage. No servers involved.',
  },
  {
    icon: WifiOff,
    title: 'Zero network requests',
    description:
      'Anicite makes no network requests whatsoever. No analytics, no telemetry.',
  },
  {
    icon: Trash2,
    title: 'Delete anytime',
    description:
      'Clear all your data in one click from settings, or uninstall the extension. Your data disappears instantly.',
  },
  {
    icon: Shield,
    title: 'No account required',
    description:
      'No sign-up, no email, no personal information collected. Install and go.',
  },
] as const;

const SECTIONS = [
  {
    title: 'What Anicite collects',
    content: [
      'Anicite records browsing activity to help you understand your habits. This includes:',
      '• **Website hostnames and paths** you visit (e.g. github.com/notifications) — query strings and URL fragments are never stored',
      '• **Active time** spent on each site, measured by tab focus and visibility',
      '• **Interaction counts**: clicks, scroll distance, and tab switches',
      '• **Timestamps**: aggregated into daily and hourly rollups',
      'Long URL paths are truncated to 180 characters. Incognito browsing is never tracked.',
    ],
  },
  {
    title: 'How data is stored',
    content: [
      "All data is stored locally on your device using Chrome's built-in chrome.storage.local API. There is no external database, no cloud storage, and no server-side component.",
      'Data is organized as per-day rollups, per-hour rollups, and lifetime totals. You can export everything as JSON or CSV at any time from the extension settings.',
    ],
  },
  {
    title: 'What Anicite does NOT collect',
    content: [
      '• No search queries or form inputs',
      '• No URL query parameters or hash fragments',
      '• No page content, screenshots, or DOM data',
      '• No personal information (name, email, location)',
      '• No incognito or private browsing activity',
      '• No data from excluded sites',
    ],
  },
  {
    title: 'Third-party sharing',
    content: [
      "There is nothing to share. Since your data never leaves your device, there is no mechanism for third-party access. Anicite has no servers, no analytics, and no advertising. We couldn't access your data even if we wanted to.",
    ],
  },
  {
    title: 'Permissions explained',
    content: [
      'Anicite requests two Chrome permissions:',
      '• **storage** — to save your browsing data locally on your device',
      '• **host permissions (http/https)** — to run the content script that measures time, clicks, and scroll on the pages you visit',
      'These are the minimum permissions required for the extension to function.',
    ],
  },
  {
    title: 'Your controls',
    content: [
      'You are always in control of your data:',
      '• **Pause tracking** at any time from the popup or settings',
      '• **Exclude specific sites** so they are never tracked',
      '• **Choose data granularity** — host-only or path-level',
      '• **Export your data** as JSON or CSV with a date range',
      '• **Delete all data** with a single action in settings',
      '• **Uninstall** the extension to remove everything permanently',
    ],
  },
  {
    title: 'Open source',
    content: [
      `Anicite is fully open source under the MIT license. You can inspect every line of code to verify these claims yourself.`,
    ],
  },
  {
    title: 'Changes to this policy',
    content: [
      'If we ever update this privacy policy, changes will be reflected on this page with an updated date. Given the local-only architecture, we do not anticipate significant changes.',
    ],
  },
  {
    title: 'Contact',
    content: [
      'If you have questions about this privacy policy or Anicite in general, you can reach us via:',
      `• **GitHub**: [${siteConfig.github}](${siteConfig.github})`,
      `• **Website**: [carboxy.dev](https://carboxy.dev)`,
    ],
  },
] as const;

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <span key={i} className="text-foreground font-medium">
          {boldMatch[1]}
        </span>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Navbar />

      <section className="px-6 pb-12 pt-24 md:pb-16 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>

            <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Anicite is built so that your data physically cannot leave your
              device. This policy explains exactly what the extension does and
              doesn&apos;t do.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Last updated: February 7, 2026
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
              className="border-border bg-card rounded-xl border p-5"
            >
              <div className="bg-primary/10 text-primary mb-3 flex h-9 w-9 items-center justify-center rounded-lg">
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-foreground mb-1 text-sm font-semibold">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          {SECTIONS.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: index * 0.03 }}
            >
              <h2 className="text-foreground mb-3 text-xl font-semibold">
                {section.title}
              </h2>
              <div className="space-y-2.5">
                {section.content.map((line, i) => (
                  <p
                    key={i}
                    className="text-muted-foreground text-sm leading-relaxed"
                  >
                    {renderContent(line)}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
