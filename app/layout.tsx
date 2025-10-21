import "@/styles/globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Study Overlay",
  description: "Clean overlays that keep your study stream focused.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
