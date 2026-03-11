'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StageBuilder } from '@/components/admin/StageBuilder';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, FileText, HelpCircle, Settings } from 'lucide-react';
import type { Opportunity, ApplicationStage } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OpportunityStagesPage({ params }: PageProps) {
  const router = useRouter();
  const [opportunityId, setOpportunityId] = useState<string | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [stages, setStages] = useState<ApplicationStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stages');

  useEffect(() => {
    params.then((p) => setOpportunityId(p.id));
  }, [params]);

  useEffect(() => {
    if (!opportunityId) return;

    async function fetchData() {
      try {
        const response = await fetch(`/api/opportunities/${opportunityId}`);
        const result = await response.json();

        if (result.success) {
          setOpportunity(result.data);
          // Load stages or create default structure
          const existingStages = result.data.applicationStages || [];
          if (existingStages.length === 0) {
            // Migrate from old questions format if exists
            const oldQuestions = result.data.applicationQuestions || [];
            if (oldQuestions.length > 0) {
              const migratedStages: ApplicationStage[] = [
                {
                  id: `stage-info-${Date.now()}`,
                  opportunityId: opportunityId!,
                  name: 'Job Information',
                  description: 'Review the job details and requirements',
                  type: 'info',
                  order: 1,
                  isRequired: true,
                  content: {
                    showJobDescription: true,
                    showRequirements: true,
                    showCompensation: true,
                    showSchedule: true,
                  },
                },
                {
                  id: `stage-questions-${Date.now()}`,
                  opportunityId: opportunityId!,
                  name: 'Application Questions',
                  description: 'Answer questions about your experience',
                  type: 'questions',
                  order: 2,
                  isRequired: true,
                  questions: oldQuestions,
                },
                {
                  id: `stage-review-${Date.now()}`,
                  opportunityId: opportunityId!,
                  name: 'Review & Submit',
                  description: 'Review your application and submit',
                  type: 'info',
                  order: 3,
                  isRequired: true,
                  content: {},
                },
              ];
              setStages(migratedStages);
            } else {
              setStages([]);
            }
          } else {
            setStages(existingStages);
          }
        } else {
          setError(result.error || 'Failed to load opportunity');
        }
      } catch (err) {
        setError('Failed to load opportunity');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [opportunityId]);

  const handleSaveStages = async (updatedStages: ApplicationStage[]) => {
    if (!opportunityId) return;

    setIsSaving(true);
    try {
      // Save stages to opportunity
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationStages: updatedStages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save stages');
      }

      // Refresh data
      const refreshResponse = await fetch(`/api/opportunities/${opportunityId}`);
      const result = await refreshResponse.json();
      if (result.success) {
        setStages(result.data.applicationStages || updatedStages);
      }
    } catch (err) {
      console.error('Failed to save stages:', err);
      setError('Failed to save stages');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !opportunity) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Opportunity not found'}</p>
          <Link href="/opportunities">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const totalQuestions = stages.reduce((acc, stage) => acc + (stage.questions?.length || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/opportunities">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{opportunity.name}</h1>
              <Badge variant="secondary">{opportunity.client}</Badge>
            </div>
            <p className="text-zinc-500 text-sm mt-1">
              Configure the application stages and questions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stages.length}</p>
                <p className="text-sm text-zinc-500">Stages</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{totalQuestions}</p>
                <p className="text-sm text-zinc-500">Questions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Settings className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">
                  {stages.filter(s => s.isRequired).length}
                </p>
                <p className="text-sm text-zinc-500">Required</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="stages">Application Stages</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="mt-6">
            <StageBuilder
              stages={stages}
              onStagesChange={setStages}
              onSave={handleSaveStages}
              isSaving={isSaving}
              opportunityId={opportunityId!}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-zinc-900 mb-4">Application Flow Preview</h3>
                <div className="space-y-3">
                  {stages.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">
                      No stages configured. Add stages to see the preview.
                    </p>
                  ) : (
                    stages.map((stage, index) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-4 p-4 bg-zinc-50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900">{stage.name}</p>
                          <p className="text-sm text-zinc-500">
                            {stage.type === 'questions' && stage.questions?.length
                              ? `${stage.questions.length} question${stage.questions.length !== 1 ? 's' : ''}`
                              : stage.type.charAt(0).toUpperCase() + stage.type.slice(1)}
                          </p>
                        </div>
                        {stage.isRequired && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-2">Application Settings</h3>
                  <p className="text-sm text-zinc-500">
                    Additional settings for this job application process.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <p className="font-medium text-zinc-900">Allow Save & Continue</p>
                    <p className="text-sm text-zinc-500">
                      Let applicants save their progress and continue later
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <p className="font-medium text-zinc-900">Email Notifications</p>
                    <p className="text-sm text-zinc-500">
                      Send confirmation emails at each stage
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
