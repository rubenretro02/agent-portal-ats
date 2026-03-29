import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const WEBMAIL_URL = process.env.WEBMAIL_URL || 'https://mail.agent-mail.online';
const SSO_SECRET = process.env.SSO_SECRET || 'your-sso-secret-key-min-32-chars!!';
// Decrypt function (must match encrypt function in activate/route.ts)
function decrypt(encryptedText: string, secretKey: string): string {
  const decoded = Buffer.from(encryptedText, 'base64').toString('binary');
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return result;
}
// Simple encrypt for passing to PHP (same algorithm)
function encrypt(text: string, secretKey: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return Buffer.from(result, 'binary').toString('base64');
}
// Base64 URL encoding
function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
// Create JWT token
function createJWT(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const signatureB64 = base64UrlEncode(signature);
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
// This endpoint redirects to the SSO PHP script on the mail server
export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return new NextResponse(generateErrorPage('Token no proporcionado'), {
        status: 401,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    // Create client with user token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });
    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new NextResponse(generateErrorPage('Sesión expirada. Por favor, recarga la página.'), {
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
      return new NextResponse(generateErrorPage('Cuenta de correo no encontrada. Contacta al administrador.'), {
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
    // Re-encrypt password with SSO_SECRET for PHP script
    const encryptedForPHP = encrypt(password, SSO_SECRET);
    // Create JWT token with credentials
    const jwtPayload = {
      email: mailAccount.email_address,
      pass: encryptedForPHP,
      exp: Math.floor(Date.now() / 1000) + 60, // Expires in 60 seconds
      iat: Math.floor(Date.now() / 1000),
    };
    const jwtToken = createJWT(jwtPayload, SSO_SECRET);
    // Redirect to SSO PHP script on mail server
    const ssoUrl = `${WEBMAIL_URL}/sso.php?token=${encodeURIComponent(jwtToken)}`;
    return NextResponse.redirect(ssoUrl);
  } catch (error) {
    console.error('[Mail SSO] Error:', error);
    return new NextResponse(generateErrorPage('Error interno. Intenta de nuevo.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
function generateErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Mail - Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
      color: white;
    }
    .error-container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    .error-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 1.5rem;
    }
    .error-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .error-message {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.7);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h2 class="error-title">Error</h2>
    <p class="error-message">${message}</p>
  </div>
</body>
</html>`;
}
