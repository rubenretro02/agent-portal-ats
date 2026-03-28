import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Initialize Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Helper to generate secure password
function generatePassword(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
// Helper to format email address
function formatEmailAddress(firstName: string, lastName: string, agentId: string, domain: string): string {
  const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${sanitize(firstName)}.${sanitize(lastName)}.${sanitize(agentId)}@${domain}`;
}
// Simple encryption (in production, use proper encryption library)
function encrypt(text: string, secretKey: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return Buffer.from(result).toString('base64');
}
// Create mailbox on mail server via webhook API
async function createMailbox(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const mailServerApi = process.env.MAIL_SERVER_API_URL;
  const mailServerApiKey = process.env.MAIL_SERVER_API_KEY;
  if (!mailServerApi) {
    // Log for manual creation if no API configured
    console.log(`[Mail] MAIL_SERVER_API_URL not configured.`);
    console.log(`[Mail] To create mailbox manually, run on mail server:`);
    console.log(`[Mail] cd /opt/mailserver && ./setup.sh email add ${email} '${password}'`);
    // Still return success - credentials will be stored
    return { success: true };
  }
  try {
    console.log(`[Mail] Creating mailbox via API: ${mailServerApi}`);
    const response = await fetch(mailServerApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': mailServerApiKey || '',
      },
      body: JSON.stringify({
        action: 'create',
        email,
        password,
      }),
    });
    const responseText = await response.text();
    console.log(`[Mail] Server response: ${response.status} - ${responseText}`);
    if (!response.ok) {
      return {
        success: false,
        error: `Mail server error: ${response.status} - ${responseText}`
      };
    }
    return { success: true };
  } catch (error) {
    console.error('[Mail] Error calling mail server API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to mail server'
    };
  }
}
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    // Create client with user token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });
    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('[Mail] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    // Create admin client with service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    // Check if user is admin or recruiter using service role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    console.log('[Mail] User profile:', profile, 'Error:', profileError);
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    if (!['admin', 'recruiter'].includes(profile.role)) {
      return NextResponse.json({
        error: 'Forbidden - Admin or recruiter access required',
        yourRole: profile.role
      }, { status: 403 });
    }
    // Get request body
    const body = await request.json();
    const { agentId } = body;
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }
    // Get agent profile info using admin client
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, user_id, agent_id')
      .eq('id', agentId)
      .single();
    if (agentError || !agent) {
      console.error('[Mail] Agent error:', agentError);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    // Get agent's profile info
    const { data: agentProfile, error: agentProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', agent.user_id)
      .single();
    if (agentProfileError || !agentProfile) {
      console.error('[Mail] Agent profile error:', agentProfileError);
      return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 });
    }
    // Check if agent already has a mail account
    const { data: existingAccount } = await supabaseAdmin
      .from('agent_mail_accounts')
      .select('id, email_address')
      .eq('agent_id', agentProfile.id)
      .single();
    if (existingAccount) {
      return NextResponse.json({
        error: 'Agent already has a mail account',
        email: existingAccount.email_address
      }, { status: 409 });
    }
    // Generate email and password
    const mailDomain = process.env.MAIL_DOMAIN || 'agent-mail.online';
    const emailAddress = formatEmailAddress(
      agentProfile.first_name,
      agentProfile.last_name,
      agent.agent_id?.replace('AGENT ', '') || 'unknown',
      mailDomain
    );
    const password = generatePassword();
    console.log(`[Mail] Creating mailbox: ${emailAddress}`);
    // Create mailbox on mail server
    const mailboxResult = await createMailbox(emailAddress, password);
    if (!mailboxResult.success) {
      return NextResponse.json({
        error: 'Failed to create mailbox on server',
        details: mailboxResult.error
      }, { status: 500 });
    }
    // Encrypt password before storing
    const encryptionKey = process.env.MAIL_ENCRYPTION_KEY || 'default-key-change-in-production';
    const encryptedPassword = encrypt(password, encryptionKey);
    // Store credentials in Supabase using admin client
    const { data: mailAccount, error: insertError } = await supabaseAdmin
      .from('agent_mail_accounts')
      .insert({
        agent_id: agentProfile.id,
        email_address: emailAddress,
        imap_password_encrypted: encryptedPassword,
        smtp_password_encrypted: encryptedPassword,
        imap_host: `mail.${mailDomain}`,
        imap_port: 993,
        smtp_host: `mail.${mailDomain}`,
        smtp_port: 587,
        is_active: true,
      })
      .select()
      .single();
    if (insertError) {
      console.error('[Mail] Database error:', insertError);
      return NextResponse.json({
        error: 'Failed to store mail credentials',
        details: insertError.message
      }, { status: 500 });
    }
    console.log(`[Mail] Successfully created mail account: ${emailAddress}`);
    return NextResponse.json({
      success: true,
      email: emailAddress,
      mailAccount: {
        id: mailAccount.id,
        email_address: mailAccount.email_address,
        is_active: mailAccount.is_active,
        created_at: mailAccount.created_at,
      }
    });
  } catch (error) {
    console.error('[Mail] Error activating mail:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
