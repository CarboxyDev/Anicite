/* eslint-disable @next/next/no-img-element */
'use client';

import { Button } from '@repo/packages-ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, LockKeyhole, ShieldCheck } from 'lucide-react';

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
            Open source
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
          </p>

          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Local-only analytics
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LockKeyhole className="h-4 w-4" />
              No sign-up
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Code2 className="h-4 w-4" />
              Open source
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 pt-3">
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-xl px-8 text-base font-semibold shadow-[0_12px_28px_-14px_hsl(var(--primary)/0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-16px_hsl(var(--primary)/0.9)]"
            >
              <a
                id="hero-add-to-chrome-cta"
                href={siteConfig.chromeWebStore}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-3 font-semibold"
              >
                Add to Chrome
                <span className="bg-primary-foreground/15 inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mt-16 md:mt-20"
        >
          <div className="from-primary/20 to-secondary/20 absolute -inset-x-4 -bottom-10 -top-16 -z-10 bg-gradient-to-t opacity-30 blur-3xl" />
          <div className="border-border bg-card relative mx-auto overflow-hidden rounded-xl border shadow-2xl">
            <div className="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <div className="bg-muted/50 ml-2 flex h-6 w-full max-w-md items-center rounded-md px-3">
                <div className="bg-muted-foreground/20 h-1.5 w-20 rounded-full" />
              </div>
            </div>
            <div className="group relative flex h-[300px] items-start justify-center overflow-hidden sm:h-[400px] md:h-[500px] lg:h-[600px]">
              <img
                src="/hero-screenshot-light.png"
                alt="App Screenshot Light"
                className="w-[180%] max-w-none object-cover object-top transition-transform duration-[3s] ease-in-out group-hover:translate-y-[calc(-100%_+_300px)] sm:group-hover:translate-y-[calc(-100%_+_400px)] md:group-hover:translate-y-[calc(-100%_+_500px)] lg:group-hover:translate-y-[calc(-100%_+_600px)] dark:hidden"
              />
              <img
                src="/hero-screenshot-dark.png"
                alt="App Screenshot Dark"
                className="hidden w-[180%] max-w-none object-cover object-top transition-transform duration-[3s] ease-in-out group-hover:translate-y-[calc(-100%_+_300px)] sm:group-hover:translate-y-[calc(-100%_+_400px)] md:group-hover:translate-y-[calc(-100%_+_500px)] lg:group-hover:translate-y-[calc(-100%_+_600px)] dark:block"
              />
              <div className="from-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
