'use client';

import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ScreenConfig {
  title: string;
  description: string;
  placeholder: string;
  narrow?: boolean;
}

const SCREENS: ScreenConfig[] = [
  {
    title: 'Quick glance popup',
    description:
      "See today's stats, current site info, and category at a glance — without leaving your tab.",
    placeholder: 'Replace with popup screenshot',
    narrow: true,
  },
  {
    title: 'Insights dashboard',
    description:
      'Dive deep with interactive charts — time by category, daily activity, hourly patterns, and your top sites.',
    placeholder: 'Replace with insights screenshot',
  },
  {
    title: 'Your rules, your way',
    description:
      'Exclude sites, manage categories, choose tracking modes, and export data whenever you want.',
    placeholder: 'Replace with settings screenshot',
  },
];

function ScreenFrame({ screen }: { screen: ScreenConfig }) {
  return (
    <div
      className={cn(
        'border-border bg-card overflow-hidden rounded-xl border shadow-sm',
        screen.narrow ? 'mx-auto w-full max-w-[280px]' : 'w-full'
      )}
    >
      <div className="border-border flex items-center gap-1.5 border-b px-3 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
      </div>
      <div
        className={cn(
          'flex items-center justify-center p-6',
          screen.narrow ? 'min-h-[360px]' : 'min-h-[280px] sm:min-h-[340px]'
        )}
      >
        <div className="flex flex-col items-center gap-2.5">
          <ImageIcon className="text-muted-foreground/30 h-10 w-10" />
          <p className="text-muted-foreground/50 text-sm">
            {screen.placeholder}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Showcase() {
  return (
    <section id="showcase" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            A look inside
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Thoughtfully designed surfaces that give you clarity without
            clutter.
          </p>
        </div>

        <div className="space-y-20">
          {SCREENS.map((screen, index) => (
            <motion.div
              key={screen.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className={cn(
                'flex flex-col items-center gap-10 md:gap-14',
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              )}
            >
              <div className="flex-1 space-y-3">
                <h3 className="text-foreground text-2xl font-semibold">
                  {screen.title}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {screen.description}
                </p>
              </div>
              <div
                className={cn(
                  'w-full',
                  screen.narrow ? 'flex-1' : 'flex-[1.2]'
                )}
              >
                <ScreenFrame screen={screen} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
