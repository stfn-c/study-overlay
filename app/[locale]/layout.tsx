import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { PostHogPageview } from "@/components/providers/posthog-provider";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { Suspense } from "react";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Study Overlay - Clean overlays for study sessions",
  description: "Generate beautiful, customizable overlays for online study sessions. Pomodoro timers, Spotify trackers, and more for studying together.",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${plusJakarta.className} antialiased`}>
        <NextIntlClientProvider>
          <div className="flex min-h-screen flex-col">
            <Suspense fallback={null}>
              <PostHogPageview />
            </Suspense>
            <main className="flex-1">
              {children}
            </main>
            <ConditionalFooter />
            <Analytics />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
