import './globals.css';

import { Toaster } from '@repo/packages-ui/sonner';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import React from 'react';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

import { Providers } from './providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Privacy-first browsing analytics`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: `${siteConfig.name} — Privacy-first browsing analytics`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — Privacy-first browsing analytics`,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          plusJakartaSans.className,
          'flex min-h-screen flex-col antialiased',
          process.env.NODE_ENV === 'development' && 'debug-screens'
        )}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
