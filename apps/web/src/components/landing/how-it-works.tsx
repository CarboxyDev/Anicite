'use client';

import { motion } from 'framer-motion';
import { BarChart3, Compass, Download } from 'lucide-react';

import { cn } from '@/lib/utils';

const STEPS = [
  {
    icon: Download,
    title: 'Install Extension',
    description:
      'Add Anicite to Chrome in a single click. No account required.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: Compass,
    title: 'Browse Normally',
    description:
      'Anicite quietly measures your productivity in the background.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: BarChart3,
    title: 'View Insights',
    description:
      'Open the insights page to see your habits, heatmaps, and top sites.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in seconds
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            No complex setup. No accounts. Just install and start tracking.
          </p>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="hidden md:absolute md:left-0 md:top-12 md:block md:w-full">
            <div className="via-border bg-linear-to-r h-0.5 w-full from-transparent to-transparent" />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="relative flex flex-col items-center text-center"
            >
              <div
                className={cn(
                  'mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border shadow-sm backdrop-blur-sm transition-transform duration-300 hover:scale-105',
                  'bg-card',
                  step.border
                )}
              >
                <div
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-2xl',
                    step.bg
                  )}
                >
                  <step.icon className={cn('h-8 w-8', step.color)} />
                </div>
              </div>

              <h3 className="text-foreground mb-3 text-xl font-bold">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
