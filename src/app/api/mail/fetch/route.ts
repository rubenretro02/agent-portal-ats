import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ImapFlow } from 'imapflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function decrypt(encryptedText: string, secretKey: string): string {
  const decoded = Buffer.from(encryptedText, 'base64').toString();
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'inbox';

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: mailAccount, error: mailError } = await supabaseAdmin
      .from('agent_mail_accounts')
      .select('*')
      .eq('agent_id', user.id)
      .single();

    if (mailError || !mailAccount || !mailAccount.is_active) {
      return NextResponse.json({ emails: [] });
    }

    const encryptionKey = process.env.MAIL_ENCRYPTION_KEY || 'default-key';
    const password = decrypt(mailAccount.imap_password_encrypted, encryptionKey);

    const client = new ImapFlow({
      host: mailAccount.imap_host || 'mail.agent-mail.online',
      port: mailAccount.imap_port || 993,
      secure: true,
      auth: { user: mailAccount.email_address, pass: password },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      const emails: any[] = [];

      try {
        const total = client.mailbox?.exists || 0;
        const start = Math.max(1, total - 49);

        for await (const msg of client.fetch(`${start}:*`, { envelope: true, flags: true })) {
          const from = msg.envelope?.from?.[0] || {};
          emails.push({
            id: msg.uid?.toString(),
            from: { name: from.name || from.address?.split('@')[0], email: from.address },
            subject: msg.envelope?.subject || '(No Subject)',
            preview: '',
            body: '',
            date: msg.envelope?.date || new Date(),
            read: msg.flags?.has('\\Seen'),
            starred: msg.flags?.has('\\Flagged'),
            labels: [],
            attachments: [],
            folder: folder,
          });
        }
      } finally {
        lock.release();
      }
      await client.logout();
      emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return NextResponse.json({ emails });
    } catch (e) {
      console.error('IMAP error:', e);
      return NextResponse.json({ emails: [] });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
