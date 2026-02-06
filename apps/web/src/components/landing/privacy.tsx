'use client';

import { motion } from 'framer-motion';
import { Check, Shield } from 'lucide-react';

const PRIVACY_POINTS = [
  'All data stored in chrome.storage.local — never leaves your device',
  'Zero network requests for analytics or telemetry',
  'No account or sign-up required',
  'Query strings and hash fragments are never saved',
  'Incognito mode is automatically excluded',
  'Full data export so you always own your data',
  'Open source — verify everything yourself',
] as const;

export function Privacy() {
  return (
    <section id="privacy" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="border-border bg-card overflow-hidden rounded-2xl border"
        >
          <div className="p-8 md:p-12">
            <div className="mb-8 flex items-start gap-4">
              <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <Shield className="text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-foreground text-2xl font-bold sm:text-3xl">
                  Privacy is the whole point
                </h2>
                <p className="text-muted-foreground mt-2 text-base">
                  We built Anicite because we wanted browsing insights without
                  the creepy trade-offs. Here&apos;s what that means in
                  practice.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PRIVACY_POINTS.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start gap-3 rounded-lg p-2"
                >
                  <div className="bg-success/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-success h-3 w-3" />
                  </div>
                  <span className="text-foreground text-sm leading-relaxed">
                    {point}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
