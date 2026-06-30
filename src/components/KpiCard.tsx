import type { LucideIcon } from 'lucide-react';

type KpiTone = 'teal' | 'red' | 'amber';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  tone: KpiTone;
}

const toneClasses: Record<KpiTone, { icon: string; value: string }> = {
  teal: {
    icon: 'bg-teal-50 text-teal-700',
    value: 'text-ink',
  },
  red: {
    icon: 'bg-danger-50 text-danger-600',
    value: 'text-danger-600',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    value: 'text-amber-600',
  },
};

export function KpiCard({ title, value, icon: Icon, tone }: KpiCardProps) {
  const classes = toneClasses[tone];

  return (
    <article className="flex min-h-32 items-center gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${classes.icon}`}
      >
        <Icon aria-hidden className="h-8 w-8" strokeWidth={1.9} />
      </div>
      <div className="min-w-0">
        <p className="text-base text-muted">{title}</p>
        <p className={`mt-2 text-4xl font-bold leading-none ${classes.value}`}>
          {value}
        </p>
      </div>
    </article>
  );
}
