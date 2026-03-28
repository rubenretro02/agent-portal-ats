import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to generate secure password
function generatePassword(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
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
  // Simple XOR encryption - in production use AES-256 or similar
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return Buffer.from(result).toString('base64');
}

// Create mailbox via external API or script
async function createMailbox(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const mailServerApi = process.env.MAIL_SERVER_API_URL;
  const mailServerApiKey = process.env.MAIL_SERVER_API_KEY;

  // If no external API configured, we'll just store the credentials
  // The actual mailbox creation can be done manually or via a separate script
  if (!mailServerApi) {
    console.log(`[Mail] No MAIL_SERVER_API_URL configured. Mailbox for ${email} should be created manually.`);
    console.log(`[Mail] Command: ./setup.sh email add ${email} '<password>'`);
    return { success: true };
  }

  try {
    const response = await fetch(mailServerApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mailServerApiKey}`,
      },
      body: JSON.stringify({
        action: 'create_mailbox',
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[Mail] Error calling mail server API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create mailbox'
    };
  }
}

export async function POST(request: NextRequest) {
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

    // Check if user is admin or recruiter
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'recruiter'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin or recruiter access required' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Get agent profile info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        user_id,
        agent_id,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agentProfile = agent.profiles as unknown as { id: string; first_name: string; last_name: string; email: string };

    // Check if agent already has a mail account
    const { data: existingAccount } = await supabase
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

    // Create mailbox (via API if configured, otherwise just log)
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

    // Store credentials in Supabase
    const { data: mailAccount, error: insertError } = await supabase
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
      console.error('Database error:', insertError);
      return NextResponse.json({
        error: 'Failed to store mail credentials',
        details: insertError.message
      }, { status: 500 });
    }

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
    console.error('Error activating mail:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
