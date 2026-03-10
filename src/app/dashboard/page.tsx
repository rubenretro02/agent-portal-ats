'use client';

import { useAuthContext } from '@/components/providers/AuthProvider';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { AgentDashboard } from '@/components/dashboard/AgentDashboard';

export default function DashboardPage() {
  const { profile, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin' || profile.role === 'recruiter';

  return (
    <UnifiedLayout title="Dashboard">
      {isAdmin ? <AdminDashboard /> : <AgentDashboard />}
    </UnifiedLayout>
  );
}
