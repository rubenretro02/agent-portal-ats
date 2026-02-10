'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { useOpportunityStore } from '@/store/supabaseStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Search,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
  Briefcase,
  X,
  Filter,
} from 'lucide-react';
import type { SystemCheckResult } from '@/lib/systemCheck';

interface StepStatus {
  personal: boolean;
  address: boolean;
  experience: boolean;
  languages: boolean;
  systemCheck: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, agent, isLoading } = useAuthContext();
  const { opportunities, fetchOpportunities, appliedOpportunityIds, fetchAppliedOpportunities, applyToOpportunity } = useOpportunityStore();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Opportunities states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Calculate onboarding status
  const isOnboardingComplete = useMemo(() => {
    if (!profile || !agent) return false;
    const address = agent.address as Record<string, string> | null;
    const experience = agent.experience as Record<string, string> | null;
    const availability = agent.availability as Record<string, string> | null;
    const langs = agent.languages as string[] | null;
    const systemCheck = agent.system_check as SystemCheckResult | null;
    const profileExt = profile as unknown as { sex?: string; date_of_birth?: string };
    return !!(
      profile.first_name && profile.last_name && profileExt.sex && profileExt.date_of_birth && profile.phone &&
      address?.street && address?.city && address?.state && address?.zipCode &&
      experience?.yearsExperience &&
      langs && langs.length > 0 && availability?.hoursPerWeek && availability?.preferredShift &&
      systemCheck
    );
  }, [profile, agent]);

  // Fetch opportunities
  useEffect(() => {
    fetchOpportunities();
    fetchAppliedOpportunities();
  }, [fetchOpportunities, fetchAppliedOpportunities]);

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [opportunities, searchQuery, categoryFilter]);

  // Handle apply
  const handleApply = async (opportunityId: string) => {
    setApplying(true);
    await applyToOpportunity(opportunityId, []);
    setApplying(false);
    setSelectedOpportunity(null);
  };

  const selectedOpp = opportunities.find(o => o.id === selectedOpportunity);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if no profile
  useEffect(() => {
    if (!isLoading && !profile) {
      redirectTimerRef.current = setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [isLoading, profile, router]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">{isLoading ? 'Loading...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    );
  }

  return (
    <PortalLayout title={isOnboardingComplete ? "Available Opportunities" : "Dashboard"}>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Onboarding Section - show if not complete */}
        {!isOnboardingComplete && (
          <OnboardingChecklist />
        )}

        {/* Opportunities Section - show when onboarding is complete */}
        {isOnboardingComplete && (
          <>
            {/* Welcome Banner */}
            <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {'Welcome, '}{profile.first_name}{'!'}
                    </h2>
                    <p className="text-sm text-zinc-600">
                      Your profile is complete. Browse and apply to available opportunities below.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search & Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Opportunities List */}
            {filteredOpportunities.length === 0 ? (
              <Card className="border-zinc-200">
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 font-medium">No opportunities available</p>
                  <p className="text-sm text-zinc-400 mt-1">Check back soon for new openings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOpportunities.map(opp => {
                  const isApplied = appliedOpportunityIds.includes(opp.id);
                  return (
                    <Card
                      key={opp.id}
                      className="border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
                      onClick={() => !isApplied && setSelectedOpportunity(opp.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-zinc-900">{opp.name}</h3>
                              {opp.category && (
                                <Badge variant="secondary" className="text-xs">{opp.category}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-zinc-500 mb-3">{opp.client}</p>
                            <div className="flex items-center gap-4 text-xs text-zinc-400">
                              {opp.compensation && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  {'$'}{opp.compensation.baseRate}/{opp.compensation.type === 'hourly' ? 'hr' : opp.compensation.type}
                                </span>
                              )}
                              {opp.capacity && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {opp.capacity.openPositions} spots
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isApplied ? (
                              <Badge className="bg-teal-100 text-teal-700 border-0">Applied</Badge>
                            ) : (
                              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                                Apply
                                <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog open={!!selectedOpportunity} onOpenChange={() => setSelectedOpportunity(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedOpp?.name}</DialogTitle>
            <DialogDescription>{selectedOpp?.client}</DialogDescription>
          </DialogHeader>
          {selectedOpp && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-zinc-600">{selectedOpp.description}</p>
              {selectedOpp.compensation && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-900 font-medium">
                    {'$'}{selectedOpp.compensation.baseRate} / {selectedOpp.compensation.type}
                  </span>
                </div>
              )}
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => handleApply(selectedOpp.id)}
                disabled={applying}
              >
                {applying ? 'Applying...' : 'Confirm Application'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
