import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    let targetProfileId = user.id;
    if (agentId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && ['admin', 'recruiter'].includes(profile.role)) {
        const { data: agent } = await supabaseAdmin
          .from('agents')
          .select('user_id')
          .eq('id', agentId)
          .single();
        if (agent) {
          targetProfileId = agent.user_id;
        }
      }
    }
    const { data: mailAccount, error: mailError } = await supabaseAdmin
      .from('agent_mail_accounts')
      .select('id, email_address, is_active, created_at, last_sync_at, sync_error, imap_host, smtp_host')
      .eq('agent_id', targetProfileId)
      .single();
    if (mailError && mailError.code !== 'PGRST116') {
      console.error('Error fetching mail account:', mailError);
      return NextResponse.json({ error: 'Failed to fetch mail status' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { data: profile } = await supabaseAdmin
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
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('user_id')
      .eq('id', agentId)
      .single();
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('agent_mail_accounts')
      .update({ is_active })
      .eq('agent_id', agent.user_id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update mail status' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      is_active: updatedAccount.is_active,
    });
  } catch (error) {
    console.error('Error updating mail status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
