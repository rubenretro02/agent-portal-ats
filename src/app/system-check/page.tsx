'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// System check is no longer a standalone page
// It's integrated into onboarding and job application flow
export default function SystemCheckPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to opportunities page
    router.replace('/opportunities');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500">Redirecting...</p>
      </div>
    </div>
  );
}
