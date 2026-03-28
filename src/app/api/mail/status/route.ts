import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent_id from query params (for admin/recruiter) or use current user
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    // Check if user is admin/recruiter viewing another agent's mail
    let targetProfileId = user.id;

    if (agentId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && ['admin', 'recruiter'].includes(profile.role)) {
        // Get the profile ID from the agent record
        const { data: agent } = await supabase
          .from('agents')
          .select('user_id')
          .eq('id', agentId)
          .single();

        if (agent) {
          targetProfileId = agent.user_id;
        }
      }
    }

    // Get mail account status
    const { data: mailAccount, error: mailError } = await supabase
      .from('agent_mail_accounts')
      .select('id, email_address, is_active, created_at, last_sync_at, sync_error, imap_host, smtp_host')
      .eq('agent_id', targetProfileId)
      .single();

    if (mailError && mailError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for agents without mail
      console.error('Error fetching mail account:', mailError);
      return NextResponse.json({
        error: 'Failed to fetch mail status'
      }, { status: 500 });
    }

    if (!mailAccount) {
      return NextResponse.json({
        has_mail: false,
        email: null,
        is_active: false,
      });
    }

    return NextResponse.json({
      has_mail: true,
      email: mailAccount.email_address,
      is_active: mailAccount.is_active,
      created_at: mailAccount.created_at,
      last_sync_at: mailAccount.last_sync_at,
      sync_error: mailAccount.sync_error,
      imap_host: mailAccount.imap_host,
      smtp_host: mailAccount.smtp_host,
    });

  } catch (error) {
    console.error('Error checking mail status:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Toggle mail active status
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/recruiter
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'recruiter'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { agentId, is_active } = body;

    if (!agentId || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Get the profile ID from the agent record
    const { data: agent } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Update mail account status
    const { data: updatedAccount, error: updateError } = await supabase
      .from('agent_mail_accounts')
      .update({ is_active })
      .eq('agent_id', agent.user_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update mail status'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_active: updatedAccount.is_active,
    });

  } catch (error) {
    console.error('Error updating mail status:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
