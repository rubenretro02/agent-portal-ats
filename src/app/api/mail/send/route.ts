import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Decrypt password
function decrypt(encryptedText: string, secretKey: string): string {
  const decoded = Buffer.from(encryptedText, 'base64').toString();
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return result;
}

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const data: SendEmailRequest = await request.json();
    const { to, subject, body } = data;

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing required fields: to, subject' }, { status: 400 });
    }

    // Verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get mail account credentials
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: mailAccount, error: mailError } = await supabaseAdmin
      .from('agent_mail_accounts')
      .select('*')
      .eq('agent_id', user.id)
      .single();

    if (mailError || !mailAccount) {
      return NextResponse.json({ error: 'Mail account not found' }, { status: 404 });
    }

    if (!mailAccount.is_active) {
      return NextResponse.json({ error: 'Mail account is not active' }, { status: 403 });
    }

    // Decrypt password
    const encryptionKey = process.env.MAIL_ENCRYPTION_KEY || 'default-key-change-in-production';
    const password = decrypt(mailAccount.smtp_password_encrypted, encryptionKey);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: mailAccount.smtp_host || 'mail.agent-mail.online',
      port: mailAccount.smtp_port || 587,
      secure: false, // Use STARTTLS
      auth: {
        user: mailAccount.email_address,
        pass: password,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: mailAccount.email_address,
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    console.log('[Mail] Email sent:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });

  } catch (error) {
    console.error('[Mail] Send error:', error);
    return NextResponse.json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
