import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { PostHogPageview } from "@/components/providers/posthog-provider";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { Suspense } from "react";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Study Overlay - Clean overlays for study sessions",
  description: "Generate beautiful, customizable overlays for online study sessions. Pomodoro timers, Spotify trackers, and more for studying together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.className} antialiased`}>
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
      </body>
    </html>
  );
}
