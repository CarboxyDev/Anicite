'use client';

import { Button } from '@repo/packages-ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, ImageIcon } from 'lucide-react';

import { siteConfig } from '@/config/site';

export function Hero() {
  return (
    <section className="px-6 pb-20 pt-24 md:pb-32 md:pt-36">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="border-border text-muted-foreground mx-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm">
            Local-only browsing analytics
            <span className="bg-border h-3.5 w-px" />
            Free forever
          </div>

          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Know where your
            <br />
            time goes
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
            A Chrome extension that helps you understand your browsing habits
            without compromising your privacy. All data stays on your device.
            Always.
          </p>

          <div className="flex items-center justify-center pt-2">
            <Button asChild size="lg">
              <a href={siteConfig.chromeWebStore} className="gap-2">
                Add to Chrome — it&apos;s free
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 md:mt-20"
        >
          <div className="border-border bg-card mx-auto overflow-hidden rounded-xl border shadow-lg">
            <div className="border-border flex items-center gap-1.5 border-b px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
              <div className="h-3 w-3 rounded-full bg-green-400/80" />
              <span className="text-muted-foreground ml-3 text-xs">
                Anicite — Insights
              </span>
            </div>
            <div className="flex min-h-[300px] items-center justify-center p-8 sm:min-h-[400px] md:min-h-[480px]">
              <div className="flex flex-col items-center gap-3">
                <ImageIcon className="text-muted-foreground/40 h-12 w-12" />
                <p className="text-muted-foreground/60 text-sm">
                  Replace with insights dashboard screenshot
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
