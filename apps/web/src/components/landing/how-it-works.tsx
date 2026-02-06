'use client';

import { motion } from 'framer-motion';
import { BarChart3, Download, Eye, type LucideIcon } from 'lucide-react';

const STEPS = [
  {
    icon: Download,
    title: 'Install',
    description: 'Add Anicite to Chrome in one click. No account needed.',
  },
  {
    icon: Eye,
    title: 'Browse',
    description:
      'Go about your day. We track time, visits, and engagement quietly in the background.',
  },
  {
    icon: BarChart3,
    title: 'Discover',
    description:
      "Open the dashboard whenever you're curious. See where your time actually went.",
  },
] as const;

function Step({
  icon: Icon,
  title,
  description,
  number,
  index,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  number: number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative mb-5">
        <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icon className="text-primary h-6 w-6" />
        </div>
        <span className="bg-primary text-primary-foreground absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
          {number}
        </span>
      </div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export function HowItWorks() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mb-14 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in seconds
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            No accounts, no configuration, no onboarding fatigue.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <Step key={step.title} {...step} number={index + 1} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
