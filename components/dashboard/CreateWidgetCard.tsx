'use client';

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

interface CreateWidgetCardProps {
  onClick: () => void;
}

export function CreateWidgetCard({ onClick }: CreateWidgetCardProps) {
  return (
    <li>
      <Card
        className="flex h-full w-full cursor-pointer flex-col justify-between gap-6 border border-dashed border-slate-300 bg-white/80 p-6 text-left shadow-[0_18px_40px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-[0_26px_60px_rgba(15,23,42,0.08)]"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
      >
        <CardContent className="flex h-full flex-col justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 bg-slate-100 text-2xl font-medium text-slate-500">
              ＋
            </span>
            <div className="space-y-1">
              <CardTitle className="text-base">Create new overlay</CardTitle>
              <CardDescription>Open the guided sheet to pick an overlay and link it.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            Start now
            <span aria-hidden="true">→</span>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}