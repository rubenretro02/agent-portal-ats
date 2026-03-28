import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Decrypt function (must match encrypt function in activate/route.ts)
function decrypt(encryptedText: string, secretKey: string): string {
  const decoded = Buffer.from(encryptedText, 'base64').toString();
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return result;
}
// This endpoint returns an HTML page that auto-submits to Roundcube login
export async function GET(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(generateErrorPage('No autorizado'), {
        status: 401,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    const token = authHeader.split(' ')[1];
    // Create client with user token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });
    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new NextResponse(generateErrorPage('Sesión expirada'), {
        status: 401,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    // Get agent's mail account
    const { data: mailAccount, error: mailError } = await supabaseAdmin
      .from('agent_mail_accounts')
      .select('email_address, imap_password_encrypted, is_active')
      .eq('agent_id', user.id)
      .single();
    if (mailError || !mailAccount) {
      return new NextResponse(generateErrorPage('Cuenta de correo no encontrada'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    if (!mailAccount.is_active) {
      return new NextResponse(generateErrorPage('Tu buzón está desactivado. Contacta al administrador.'), {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    // Decrypt password
    const encryptionKey = process.env.MAIL_ENCRYPTION_KEY || 'default-key-change-in-production';
    const password = decrypt(mailAccount.imap_password_encrypted, encryptionKey);
    // Return JSON with credentials for the client to use
    return NextResponse.json({
      success: true,
      credentials: {
        user: mailAccount.email_address,
        pass: password,
      },
      webmailUrl: 'https://mail.agent-mail.online',
    });
  } catch (error) {
    console.error('[Mail Autologin] Error:', error);
    return new NextResponse(generateErrorPage('Error interno'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
function generateErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Agent Mail</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f4f4f5;
    }
    .error {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .error h2 { color: #ef4444; margin-bottom: 0.5rem; }
    .error p { color: #71717a; }
  </style>
</head>
<body>
  <div class="error">
    <h2>Error</h2>
    <p>${message}</p>
  </div>
</body>
</html>
  `;
}
