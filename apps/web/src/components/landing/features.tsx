'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  FileDown,
  FolderKanban,
  HardDrive,
  type LucideIcon,
  Moon,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: HardDrive,
    title: 'Local-only storage',
    description:
      'Your browsing data never leaves your device. No servers, no cloud, no exceptions.',
  },
  {
    icon: BarChart3,
    title: 'Rich visualizations',
    description:
      'Donut charts, heatmaps, and daily activity breakdowns to make sense of your habits.',
  },
  {
    icon: FolderKanban,
    title: 'Smart categories',
    description:
      'Sites are auto-categorized as productive, social, entertainment, and more. Override anytime.',
  },
  {
    icon: Zap,
    title: 'Productivity insights',
    description:
      'See your productive percentage at a glance. Know instantly how much of your time is spent on work vs distractions.',
  },
  {
    icon: Moon,
    title: 'Light & dark mode',
    description:
      'A polished interface that adapts to your system preference or manual toggle.',
  },
  {
    icon: FileDown,
    title: 'Export your data',
    description:
      'Download everything as JSON or CSV anytime. Your data, your format, your choice.',
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
