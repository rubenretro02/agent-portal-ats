'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOpportunitiesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/opportunities');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
