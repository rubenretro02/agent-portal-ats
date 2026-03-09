'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { useOpportunityStore } from '@/store/supabaseStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  Users,
  ArrowRight,
  Briefcase,
  Clock,
  ChevronRight,
} from 'lucide-react';

export function AgentDashboard() {
  const { profile, agent } = useAuthContext();
  const { opportunities, fetchOpportunities, appliedOpportunityIds, fetchAppliedOpportunities, applyToOpportunity } = useOpportunityStore();

  // Opportunities states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Calculate onboarding progress - simplified, system check is OPTIONAL
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
      return matchesSearch;
    });
  }, [opportunities, searchQuery]);

  // Handle apply
  const handleApply = async (opportunityId: string) => {
    setApplying(true);
    await applyToOpportunity(opportunityId, []);
    setApplying(false);
    setSelectedOpportunity(null);
  };

  const selectedOpp = opportunities.find(o => o.id === selectedOpportunity);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              {onboardingProgress.complete ? (
                <CheckCircle2 className="h-6 w-6 text-teal-600" />
              ) : (
                <Clock className="h-6 w-6 text-teal-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-zinc-900">
                Welcome, {profile?.first_name || 'Agent'}!
              </h2>
              {onboardingProgress.complete ? (
                <p className="text-sm text-zinc-600">
                  Your profile is complete. Browse and apply to opportunities below.
                </p>
              ) : (
                <div className="mt-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-zinc-600">Profile {onboardingProgress.percent}% complete</span>
                    <Link href="/onboarding" className="text-teal-600 hover:text-teal-700 font-medium text-xs">
                      Complete Profile →
                    </Link>
                  </div>
                  <Progress value={onboardingProgress.percent} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Section - Show compact version if not complete */}
      {!onboardingProgress.complete && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-amber-800 text-sm">Complete your profile to apply</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Missing: {onboardingProgress.missing.join(', ')}
                </p>
              </div>
              <Link href="/onboarding">
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                  Complete
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities Section - ALWAYS VISIBLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">Available Opportunities</h3>
          <Link href="/opportunities">
            <Button variant="ghost" size="sm" className="text-teal-600">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
            {filteredOpportunities.slice(0, 5).map(opp => {
              const isApplied = appliedOpportunityIds.includes(opp.id);
              const canApply = onboardingProgress.complete;

              return (
                <Card
                  key={opp.id}
                  className="border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
                  onClick={() => canApply && !isApplied && setSelectedOpportunity(opp.id)}
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
                              ${String(opp.compensation.baseRate)}/hr
                            </span>
                          )}
                          {opp.capacity && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {String((opp.capacity as Record<string, unknown>).openPositions)} spots
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isApplied ? (
                          <Badge className="bg-teal-100 text-teal-700 border-0">Applied</Badge>
                        ) : !canApply ? (
                          <Badge variant="outline" className="text-zinc-500">Complete Profile First</Badge>
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

            {filteredOpportunities.length > 5 && (
              <Link href="/opportunities" className="block">
                <Card className="border-zinc-200 hover:border-teal-300 transition-colors">
                  <CardContent className="p-4 text-center">
                    <span className="text-teal-600 font-medium text-sm">
                      View all {filteredOpportunities.length} opportunities →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
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
                    ${String(selectedOpp.compensation.baseRate)} / hr
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
    </div>
  );
}
