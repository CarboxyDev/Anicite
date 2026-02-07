'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface ScreenConfig {
  title: string;
  description: string;
  imageSrc: string;
  narrow?: boolean;
}

const SCREENS: ScreenConfig[] = [
  {
    title: 'Quick glance popup',
    description:
      "See today's stats, current site info, and category at a glance — without leaving your tab.",
    imageSrc: '/showcase-popup.png',
    narrow: true,
  },
  {
    title: 'Insights dashboard',
    description:
      'Dive deep with interactive charts — time by category, daily activity, hourly patterns, and your top sites.',
    imageSrc: '/showcase-insights.png',
  },
  {
    title: 'Your rules, your way',
    description:
      'Exclude sites, manage categories, choose tracking modes, and export data whenever you want.',
    imageSrc: '/showcase-settings.png',
  },
];

function ScreenFrame({ screen }: { screen: ScreenConfig }) {
  return (
    <div
      className={cn(
        'border-border bg-card hover:border-primary/20 overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md',
        screen.narrow ? 'mx-auto w-full max-w-[280px]' : 'w-full'
      )}
    >
      <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-3 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="bg-muted/50 ml-1.5 flex h-5 w-full items-center rounded-md px-2">
          <div className="bg-muted-foreground/20 h-1.5 w-12 rounded-full" />
        </div>
      </div>
      <div
        className={cn(
          'group relative flex items-start justify-center overflow-hidden',
          screen.narrow ? 'h-[350px]' : 'h-[300px] sm:h-[400px]'
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screen.imageSrc}
          alt={screen.title}
          className={cn(
            'object-cover object-top transition-transform duration-[4s] ease-in-out',
            screen.narrow
              ? 'h-full w-full'
              : 'w-[180%] max-w-none group-hover:translate-y-[calc(-100%_+_300px)] sm:group-hover:translate-y-[calc(-100%_+_400px)]'
          )}
        />
        <div className="from-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
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
