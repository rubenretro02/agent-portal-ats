'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuestionBuilder } from '@/components/admin/QuestionBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Opportunity, ApplicationQuestion } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OpportunityQuestionsPage({ params }: PageProps) {
  const router = useRouter();
  const [opportunityId, setOpportunityId] = useState<string | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setQuestions(result.data.applicationQuestions || []);
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

  const handleSaveQuestions = async (updatedQuestions: ApplicationQuestion[]) => {
    if (!opportunityId) return;

    setIsSaving(true);
    try {
      // Separate new questions from existing ones
      const newQuestions = updatedQuestions.filter((q) => q.id.startsWith('new-'));
      const existingQuestions = updatedQuestions.filter((q) => !q.id.startsWith('new-'));

      // Create new questions
      for (const question of newQuestions) {
        await fetch(`/api/opportunities/${opportunityId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question),
        });
      }

      // Update order for existing questions
      if (existingQuestions.length > 0) {
        await fetch(`/api/opportunities/${opportunityId}/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: existingQuestions.map((q, idx) => ({ id: q.id, order: idx + 1 })),
          }),
        });

        // Update each existing question
        for (const question of existingQuestions) {
          await fetch(`/api/questions/${question.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question),
          });
        }
      }

      // Find deleted questions
      const deletedQuestions = questions.filter(
        (q) => !updatedQuestions.find((uq) => uq.id === q.id)
      );

      // Delete removed questions
      for (const question of deletedQuestions) {
        if (!question.id.startsWith('new-')) {
          await fetch(`/api/questions/${question.id}`, { method: 'DELETE' });
        }
      }

      // Refresh data
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      const result = await response.json();
      if (result.success) {
        setQuestions(result.data.applicationQuestions || []);
      }
    } catch (err) {
      console.error('Failed to save questions:', err);
      setError('Failed to save questions');
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
          <Link href="/admin/opportunities">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/opportunities">
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
              Manage application questions for this opportunity
            </p>
          </div>
        </div>

        {/* Opportunity Info */}
        <Card className="border-zinc-200 bg-zinc-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600">{opportunity.description}</p>
                <div className="flex gap-2 mt-2">
                  {opportunity.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-teal-600">{questions.length}</p>
                <p className="text-xs text-zinc-500">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Builder */}
        <QuestionBuilder
          questions={questions}
          onQuestionsChange={setQuestions}
          onSave={handleSaveQuestions}
          isSaving={isSaving}
        />
      </div>
    </AdminLayout>
  );
}
