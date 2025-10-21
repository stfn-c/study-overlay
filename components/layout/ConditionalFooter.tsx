'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on widget routes
  if (pathname?.startsWith('/widget')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-900">Study Overlay</span>
            <span className="text-xs text-slate-500">
              Made with ❤️ by Stefan
            </span>
            <span className="text-xs text-slate-500">
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resources
              </span>
              <Link
                href="/obs-help"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                OBS Setup Guide
              </Link>
              <a
                href="https://obsproject.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Download OBS ↗
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Legal
              </span>
              <Link
                href="/privacy"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Terms of Service
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Connect
              </span>
              <a
                href="https://instagram.com/stfn.c"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Instagram @stfn.c ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
