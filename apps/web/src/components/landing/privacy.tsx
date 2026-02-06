'use client';

import { motion } from 'framer-motion';
import {
  Code,
  EyeOff,
  HardDrive,
  type LucideIcon,
  WifiOff,
} from 'lucide-react';

const PROMISES = [
  {
    icon: HardDrive,
    title: 'Stored on your device',
    description:
      'All data lives in chrome.storage.local. No servers, no cloud, no third parties. Ever.',
  },
  {
    icon: WifiOff,
    title: 'Zero network requests',
    description:
      'Anicite makes exactly zero requests to any external server. No analytics, no telemetry, no pings.',
  },
  {
    icon: EyeOff,
    title: 'You own everything',
    description:
      'Export all your data as JSON or CSV at any time. Pause tracking, exclude sites, or wipe everything in one click.',
  },
] as const;

function PrivacyCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="border-border bg-card rounded-xl border p-6"
    >
      <div className="bg-primary/10 text-primary mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-foreground mb-2 text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export function Privacy() {
  return (
    <section id="privacy" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy isn&apos;t a feature — it&apos;s the architecture
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            We built Anicite so that privacy violations are structurally
            impossible, not just promised.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map((promise, index) => (
            <PrivacyCard key={promise.title} {...promise} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-2"
        >
          <Code className="text-muted-foreground h-4 w-4" />
          <p className="text-muted-foreground text-sm">
            Don&apos;t take our word for it —{' '}
            <a
              href="https://github.com/CarboxyDev/anicite"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
            >
              read the source
            </a>
            {' · '}
            <a
              href="/privacy"
              className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
            >
              full privacy policy
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
