'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useOpportunityStore } from '@/store/supabaseStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp,
  Star,
  Zap,
  Target,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { ApplicationAnswer } from '@/types';

export function AgentDashboard() {
  const { profile, agent } = useAuthContext();
  const { opportunities, fetchOpportunities, appliedOpportunityIds, fetchAppliedOpportunities, applyToOpportunity } = useOpportunityStore();

  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-teal-100 text-sm font-medium">Welcome back</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Hello, {profile?.first_name || 'Agent'}!
              </h1>
              <p className="text-teal-100 max-w-md">
                {onboardingProgress.complete
                  ? "Your profile is complete. Start exploring opportunities and grow your career."
                  : `Complete your profile to unlock all features. You're ${onboardingProgress.percent}% there!`
                }
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {onboardingProgress.complete ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="font-medium">Profile Complete</span>
                </div>
              ) : (
                <Link href="/onboarding">
                  <Button className="bg-white text-teal-600 hover:bg-teal-50">
                    Complete Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {!onboardingProgress.complete && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Profile Completion</span>
                <span className="font-bold">{onboardingProgress.percent}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${onboardingProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg shadow-teal-500/10 bg-gradient-to-br from-white to-teal-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-teal-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-teal-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{opportunities.length}</p>
            <p className="text-sm text-zinc-500">Available Jobs</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{appliedCount}</p>
            <p className="text-sm text-zinc-500">Applications</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-white to-amber-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{onboardingProgress.percent}%</p>
            <p className="text-sm text-zinc-500">Profile Score</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-cyan-500/10 bg-gradient-to-br from-white to-cyan-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-cyan-600" />
              </div>
              <Clock className="h-4 w-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {agent?.pipeline_status === 'active' ? 'Active' : 'Pending'}
            </p>
            <p className="text-sm text-zinc-500">Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Alert - only if not complete */}
      {!onboardingProgress.complete && (
        <Card className="border-2 border-dashed border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 mb-1">Complete Your Profile</h3>
                <p className="text-sm text-zinc-600">
                  Missing: {onboardingProgress.missing.join(', ')}
                </p>
              </div>
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25">
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Opportunities Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Top Opportunities</h2>
            <p className="text-sm text-zinc-500">Hand-picked jobs matching your profile</p>
          </div>
          <Link href="/opportunities">
            <Button variant="outline" className="gap-2">
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
                  className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                    index === 0 ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white' : 'bg-white'
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
                      <p className={`text-sm ${index === 0 ? 'text-teal-100' : 'text-zinc-500'}`}>
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

                    <div className={`flex items-center gap-4 mb-4 text-sm ${index === 0 ? 'text-teal-100' : 'text-zinc-500'}`}>
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
                            ? 'bg-white text-teal-600 hover:bg-teal-50'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25'
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/applications">
          <Card className="group border-zinc-200 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">My Applications</h3>
                <p className="text-sm text-zinc-500">Track your application status</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="group border-zinc-200 hover:border-cyan-300 hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">My Profile</h3>
                <p className="text-sm text-zinc-500">View and update your information</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
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
                <div className="bg-cyan-50 rounded-xl p-4 text-center">
                  <Users className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-cyan-700">
                    {selectedOpp.capacity?.openPositions || 0}
                  </p>
                  <p className="text-sm text-cyan-600">open spots</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOpportunity(null)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
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
