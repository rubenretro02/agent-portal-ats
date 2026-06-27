'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useOpportunityStore } from '@/store/supabaseStore';
import { OnboardingModal } from './OnboardingModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  DollarSign,
  Users,
  ArrowRight,
  Briefcase,
  Clock,
  Star,
  Zap,
  Target,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { ApplicationAnswer } from '@/types';

export function AgentDashboard() {
  const router = useRouter();
  const { profile, agent, refreshProfile } = useAuthContext();
  const { opportunities, fetchOpportunities, appliedOpportunityIds, fetchAppliedOpportunities, applyToOpportunity } = useOpportunityStore();

  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Calculate onboarding progress
  const onboardingProgress = useMemo(() => {
    if (!profile || !agent) return { complete: false, percent: 0, missing: [] as string[] };

    const address = agent.address as Record<string, string> | null;
    const experience = agent.experience as Record<string, string> | null;
    const availability = agent.availability as Record<string, string> | null;
    const langs = agent.languages as string[] | null;
    const profileExt = profile as unknown as { sex?: string; date_of_birth?: string };

    const checks = [
      { key: 'name', done: !!(profile.first_name && profile.last_name), label: 'Basic Info' },
      { key: 'personal', done: !!(profileExt.sex && profileExt.date_of_birth && profile.phone), label: 'Personal Details' },
      { key: 'address', done: !!(address?.street && address?.city && address?.state && address?.zipCode), label: 'Address' },
      { key: 'experience', done: !!experience?.yearsExperience, label: 'Experience' },
      { key: 'languages', done: !!(langs && langs.length > 0), label: 'Languages' },
      { key: 'availability', done: !!(availability?.hoursPerWeek && availability?.preferredShift), label: 'Availability' },
    ];

    const completed = checks.filter(c => c.done).length;
    const missing = checks.filter(c => !c.done).map(c => c.label);

    return {
      complete: missing.length === 0,
      percent: Math.round((completed / checks.length) * 100),
      missing,
    };
  }, [profile, agent]);

  useEffect(() => {
    fetchOpportunities();
    fetchAppliedOpportunities();
  }, [fetchOpportunities, fetchAppliedOpportunities]);

  const handleApply = async (opportunityId: string) => {
    setApplying(true);
    const answers: ApplicationAnswer[] = [];
    await applyToOpportunity(opportunityId, answers);
    setApplying(false);
    setSelectedOpportunity(null);
  };

  const selectedOpp = opportunities.find(o => o.id === selectedOpportunity);
  const topOpportunities = opportunities.slice(0, 3);
  const appliedCount = appliedOpportunityIds.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 text-white">
        <div className="absolute inset-0 grid-noise opacity-[0.15]" />
        <div className="absolute -top-24 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-yellow-200" />
                Welcome back
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-1.5">
                Hello, {profile?.first_name || 'Agent'}
              </h1>
              <p className="text-white/75 max-w-md text-[15px] leading-relaxed">
                {onboardingProgress.complete
                  ? "Your profile is complete. Start exploring opportunities and grow your career."
                  : `Complete your profile to unlock all features — you're ${onboardingProgress.percent}% there.`
                }
              </p>
            </div>

            <div className="hidden md:flex items-center">
              {onboardingProgress.complete ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full ring-1 ring-white/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="font-medium text-sm">Profile Complete</span>
                </div>
              ) : (
                <Button onClick={() => setShowOnboardingModal(true)} className="bg-white text-[var(--brand-blue)] hover:bg-white/90 shadow-sm">
                  Complete Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {!onboardingProgress.complete && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
                <span>Profile completion</span>
                <span className="font-semibold">{onboardingProgress.percent}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${onboardingProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Briefcase} value={opportunities.length} label="Available Jobs" accent="text-[var(--brand-blue)]" chip="bg-[var(--brand-blue-soft)]" />
        <StatCard icon={Target} value={appliedCount} label="Applications" accent="text-emerald-600" chip="bg-emerald-50" />
        <StatCard icon={Star} value={`${onboardingProgress.percent}%`} label="Profile Score" accent="text-amber-600" chip="bg-amber-50" />
        <StatCard
          icon={Clock}
          value={agent?.pipeline_status === 'active' ? 'Active' : 'Pending'}
          label="Status"
          accent="text-[var(--brand-purple)]"
          chip="bg-[var(--brand-purple-soft)]"
        />
      </div>

      {/* Onboarding Banner - only if not complete */}
      {!onboardingProgress.complete && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">Complete Your Profile</h3>
                <p className="text-sm text-zinc-600">Required to apply for opportunities</p>
              </div>
              <Button
                onClick={() => setShowOnboardingModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Complete Now
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
        onComplete={() => refreshProfile()}
      />

      {/* Top Opportunities Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Top Opportunities</h2>
            <p className="text-sm text-zinc-500">Hand-picked jobs matching your profile</p>
          </div>
          <Link href="/opportunities">
            <Button variant="ghost" className="gap-1.5 text-[var(--brand-blue)] hover:bg-[var(--brand-blue-soft)]">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {topOpportunities.length === 0 ? (
          <Card className="border-zinc-200">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">No Opportunities Yet</h3>
              <p className="text-sm text-zinc-500">Check back soon for new openings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topOpportunities.map((opp, index) => {
              const isApplied = appliedOpportunityIds.includes(opp.id);
              const canApply = onboardingProgress.complete;
              const comp = opp.compensation as Record<string, number> | null;

              return (
                <Card
                  key={opp.id}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                    index === 0
                      ? 'gradient-brand text-white border-0 shadow-lg'
                      : 'bg-white border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-zinc-300'
                  }`}
                >
                  {index === 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-400 text-yellow-900 font-medium">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className={`font-semibold text-lg mb-1 ${index === 0 ? 'text-white' : 'text-zinc-900'}`}>
                        {opp.name}
                      </h3>
                      <p className={`text-sm ${index === 0 ? 'text-white/75' : 'text-zinc-500'}`}>
                        {opp.client}
                      </p>
                    </div>

                    {opp.category && (
                      <Badge
                        variant="secondary"
                        className={`mb-4 ${index === 0 ? 'bg-white/20 text-white border-0' : ''}`}
                      >
                        {opp.category}
                      </Badge>
                    )}

                    <div className={`flex items-center gap-4 mb-4 text-sm ${index === 0 ? 'text-white/75' : 'text-zinc-500'}`}>
                      <div className="flex items-center gap-1">
                        <DollarSign className={`h-4 w-4 ${index === 0 ? 'text-emerald-300' : 'text-emerald-500'}`} />
                        <span className={`font-semibold ${index === 0 ? 'text-white' : 'text-zinc-900'}`}>
                          ${comp?.baseRate || 0}/hr
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{opp.capacity?.openPositions || 0} spots</span>
                      </div>
                    </div>

                    {isApplied ? (
                      <div className={`flex items-center gap-2 py-2 px-4 rounded-lg ${
                        index === 0 ? 'bg-white/20' : 'bg-emerald-50'
                      }`}>
                        <CheckCircle2 className={`h-4 w-4 ${index === 0 ? 'text-emerald-300' : 'text-emerald-500'}`} />
                        <span className={`text-sm font-medium ${index === 0 ? 'text-white' : 'text-emerald-700'}`}>
                          Applied
                        </span>
                      </div>
                    ) : !canApply ? (
                      <Button
                        variant="outline"
                        className={`w-full ${index === 0 ? 'border-white/30 text-white hover:bg-white/10' : ''}`}
                        disabled
                      >
                        Complete Profile First
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${
                          index === 0
                            ? 'bg-white text-[var(--brand-blue)] hover:bg-white/90'
                            : 'btn-brand h-10'
                        }`}
                        onClick={() => setSelectedOpportunity(opp.id)}
                      >
                        Apply Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/applications">
          <Card className="group border border-zinc-200/80 shadow-sm rounded-2xl hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-blue-soft)] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <Target className="h-5 w-5 text-[var(--brand-blue)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 text-[15px]">My Applications</h3>
                <p className="text-sm text-zinc-500">Track your application status</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-[var(--brand-blue)] group-hover:translate-x-0.5 transition-all" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="group border border-zinc-200/80 shadow-sm rounded-2xl hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-purple-soft)] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <Award className="h-5 w-5 text-[var(--brand-purple)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 text-[15px]">My Profile</h3>
                <p className="text-sm text-zinc-500">View and update your information</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-[var(--brand-purple)] group-hover:translate-x-0.5 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Apply Dialog */}
      <Dialog open={!!selectedOpportunity} onOpenChange={() => setSelectedOpportunity(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedOpp?.name}</DialogTitle>
            <DialogDescription>{selectedOpp?.client}</DialogDescription>
          </DialogHeader>
          {selectedOpp && (
            <div className="space-y-4 py-4">
              <p className="text-zinc-600">{selectedOpp.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <DollarSign className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">
                    ${String((selectedOpp.compensation as Record<string, unknown>)?.baseRate || 0)}
                  </p>
                  <p className="text-sm text-emerald-600">per hour</p>
                </div>
                <div className="bg-[var(--brand-blue-soft)] rounded-xl p-4 text-center">
                  <Users className="h-6 w-6 text-[var(--brand-blue)] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[var(--brand-blue)]">
                    {selectedOpp.capacity?.openPositions || 0}
                  </p>
                  <p className="text-sm text-[var(--brand-blue)]">open spots</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOpportunity(null)}>
              Cancel
            </Button>
            <Button
              className="btn-brand"
              onClick={() => selectedOpp && handleApply(selectedOpp.id)}
              disabled={applying}
            >
              {applying ? 'Submitting...' : 'Confirm Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
  chip,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  accent: string;
  chip: string;
}) {
  return (
    <Card className="border border-zinc-200/80 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={`w-9 h-9 rounded-xl ${chip} flex items-center justify-center mb-3`}>
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
        <p className="text-2xl font-bold text-zinc-900 tracking-tight leading-none">{value}</p>
        <p className="text-sm text-zinc-500 mt-1.5">{label}</p>
      </CardContent>
    </Card>
  );
}
