'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Install from Chrome Web Store',
    description: 'One click. A quick walkthrough introduces the basics.',
  },
  {
    number: '02',
    title: 'Browse like you normally do',
    description: 'Time, visits, and engagement are tracked in the background.',
  },
  {
    number: '03',
    title: 'Open Insights whenever you want',
    description:
      'Charts, heatmaps, and top sites — all in a dedicated dashboard.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in seconds
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            No accounts, no configuration. Just a quick intro and you&apos;re
            off.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="border-border bg-card flex items-center gap-6 rounded-xl border px-6 py-5"
            >
              <span className="text-primary text-2xl font-bold tabular-nums">
                {step.number}
              </span>
              <div>
                <h3 className="text-foreground text-base font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
