import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="text-4xl font-bold tracking-normal text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">{subtitle}</p>
      </div>

      {actions && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {actions}
        </div>
      )}
    </header>
  );
}
