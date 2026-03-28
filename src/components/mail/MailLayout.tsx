'use client';

import { ReactNode } from 'react';

interface MailLayoutProps {
  children: ReactNode;
}

export function MailLayout({ children }: MailLayoutProps) {
  return (
    <div className="flex-1 flex bg-zinc-950 overflow-hidden">
      {children}
    </div>
  );
}
