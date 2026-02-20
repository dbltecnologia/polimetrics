import { ReactNode } from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function AdminHeader({ title, subtitle, children }: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-card px-4 md:px-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 justify-end">{children}</div>}
    </header>
  );
}
