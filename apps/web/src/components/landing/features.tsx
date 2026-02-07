'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle,
  Code2,
  Database,
  FolderKanban,
  HardDrive,
  type LucideIcon,
} from 'lucide-react';

const FEATURES = [
  {
    icon: HardDrive,
    title: 'Local-only storage',
    description:
      'Your data never leaves your device. No servers, no cloud, no exceptions.',
  },
  {
    icon: BarChart3,
    title: 'Rich visualizations',
    description:
      'Donut charts, heatmaps, daily activity breakdowns, and more to make sense of your habits.',
  },
  {
    icon: FolderKanban,
    title: 'Smart categories',
    description:
      'Sites are auto-categorized as productive, social, entertainment, and more. Change them anytime.',
  },
  {
    icon: CheckCircle,
    title: 'Comprehensive insights',
    description:
      'See your productivity, distractions, and more in one place. Know exactly where your time goes.',
  },
  {
    icon: Database,
    title: 'You own your data',
    description:
      'Download your data as JSON/CSV anytime. You can also clear your data whenever you want.',
  },
  {
    icon: Code2,
    title: 'Fully open source',
    description:
      'Trust via transparency. You can inspect the code on Github anytime you want.',
  },
] as const;

function FeatureCard({
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
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="border-border bg-card group rounded-xl border p-6"
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

export function Features() {
  return (
    <section id="features" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Built for people who care about their time and their privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
