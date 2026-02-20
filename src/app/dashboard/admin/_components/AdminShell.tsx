'use client';

import { ReactNode } from 'react';
import { LogoutProvider } from '@/hooks/use-auth';

export function AdminShell({ children }: { children: ReactNode }) {
  return <LogoutProvider>{children}</LogoutProvider>;
}
