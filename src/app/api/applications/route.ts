import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendApplicationConfirmationEmail } from '@/lib/email';

// GET /api/applications - List applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const opportunityId = searchParams.get('opportunityId');
    const status = searchParams.get('status');

    const applications = await prisma.application.findMany({
      where: {
        ...(agentId && { agentId }),
        ...(opportunityId && { opportunityId }),
        ...(status && { status }),
      },
      include: {
        opportunity: true,
        agent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Parse JSON values in answers
    const parsed = applications.map((app) => ({
      ...app,
      answers: app.answers.map((a) => ({
        ...a,
        value: JSON.parse(a.value),
        question: {
          ...a.question,
          options: a.question.options ? JSON.parse(a.question.options) : null,
        },
      })),
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST /api/applications - Submit a new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, opportunityId, answers } = body;

    // Check if already applied
    const existing = await prisma.application.findUnique({
      where: {
        agentId_opportunityId: { agentId, opportunityId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You have already applied to this opportunity' },
        { status: 400 }
      );
    }

    // Get opportunity and agent info for email
    const [opportunity, agent] = await Promise.all([
      prisma.opportunity.findUnique({ where: { id: opportunityId } }),
      prisma.agent.findUnique({
        where: { id: agentId },
        include: { user: true },
      }),
    ]);

    if (!opportunity || !agent) {
      return NextResponse.json(
        { success: false, error: 'Opportunity or agent not found' },
        { status: 404 }
      );
    }

    // Create application with answers
    const application = await prisma.application.create({
      data: {
        agentId,
        opportunityId,
        status: 'pending',
        answers: {
          create: answers.map((answer: { questionId: string; value: unknown }) => ({
            questionId: answer.questionId,
            value: JSON.stringify(answer.value),
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    // Send confirmation email
    try {
      await sendApplicationConfirmationEmail({
        to: agent.user.email,
        agentName: `${agent.user.firstName} ${agent.user.lastName}`,
        opportunityName: opportunity.name,
        applicationId: application.id,
        clientName: opportunity.client,
      });

      // Update application to mark email as sent
      await prisma.application.update({
        where: { id: application.id },
        data: {
          confirmationEmailSent: true,
          confirmationEmailSentAt: new Date(),
        },
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...application,
          applicationId: application.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit application' }, { status: 500 });
  }
}
