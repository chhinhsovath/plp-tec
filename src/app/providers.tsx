'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { AntdProvider } from '@/providers/AntdProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AntdProvider>
        {children}
      </AntdProvider>
    </SessionProvider>
  );
}