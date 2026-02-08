import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/opportunities - List all opportunities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeQuestions = searchParams.get('includeQuestions') === 'true';

    const opportunities = await prisma.opportunity.findMany({
      where: status ? { status } : undefined,
      include: includeQuestions ? { questions: { orderBy: { order: 'asc' } } } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsed = opportunities.map((opp: Record<string, unknown>) => {
      const baseOpp = {
        ...opp,
        requirements: opp.requirements ? JSON.parse(opp.requirements as string) : null,
        compensation: opp.compensation ? JSON.parse(opp.compensation as string) : null,
        schedule: opp.schedule ? JSON.parse(opp.schedule as string) : null,
        training: opp.training ? JSON.parse(opp.training as string) : null,
        tags: opp.tags ? JSON.parse(opp.tags as string) : [],
        capacity: {
          maxAgents: opp.maxAgents,
          currentAgents: opp.currentAgents,
          openPositions: opp.openPositions,
        },
      };

      if (opp.questions && Array.isArray(opp.questions)) {
        return {
          ...baseOpp,
          applicationQuestions: opp.questions.map((q: Record<string, unknown>) => ({
            ...q,
            options: q.options ? JSON.parse(q.options as string) : null,
            validation: q.validation ? JSON.parse(q.validation as string) : null,
          })),
        };
      }

      return baseOpp;
    });

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

// POST /api/opportunities - Create a new opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const opportunity = await prisma.opportunity.create({
      data: {
        name: body.name,
        description: body.description || '',
        client: body.client,
        status: body.status || 'draft',
        category: body.category,
        requirements: body.requirements ? JSON.stringify(body.requirements) : null,
        compensation: body.compensation ? JSON.stringify(body.compensation) : null,
        schedule: body.schedule ? JSON.stringify(body.schedule) : null,
        maxAgents: body.capacity?.maxAgents || 50,
        currentAgents: body.capacity?.currentAgents || 0,
        openPositions: body.capacity?.openPositions || 50,
        training: body.training ? JSON.stringify(body.training) : null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
      },
    });

    return NextResponse.json({ success: true, data: opportunity }, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ success: false, error: 'Failed to create opportunity' }, { status: 500 });
  }
}
