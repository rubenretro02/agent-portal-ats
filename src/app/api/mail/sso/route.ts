import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const WEBMAIL_URL = process.env.WEBMAIL_URL || 'https://mail.agent-mail.online';

// Decrypt function (must match encrypt function in activate/route.ts)
function decrypt(encryptedText: string, secretKey: string): string {
  const decoded = Buffer.from(encryptedText, 'base64').toString();
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
  }
  return result;
}

// This endpoint returns an HTML page that auto-submits to Roundcube login (SSO like Okta SWA)
export async function GET(request: NextRequest) {
  try {
    // Get token from query params (for iframe usage)
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

    // Return HTML page that auto-submits login form to Roundcube (SWA-style)
    return new NextResponse(generateAutoLoginPage(mailAccount.email_address, password, WEBMAIL_URL), {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

  } catch (error) {
    console.error('[Mail SSO] Error:', error);
    return new NextResponse(generateErrorPage('Error interno. Intenta de nuevo.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function generateAutoLoginPage(email: string, password: string, webmailUrl: string): string {
  // Escape special characters for HTML display
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Encode credentials as base64 to avoid issues with special characters in JS
  const credentialsBase64 = Buffer.from(JSON.stringify({ user: email, pass: password })).toString('base64');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Mail - Conectando...</title>
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
    .loading-container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      font-size: 1rem;
      color: rgba(255,255,255,0.8);
    }
    .loading-email {
      font-size: 0.875rem;
      color: #14b8a6;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="loading-container">
    <div class="spinner"></div>
    <p class="loading-text">Iniciando sesión automáticamente...</p>
    <p class="loading-email">${escapeHtml(email)}</p>
  </div>

  <script>
    // Decode credentials and create auto-submit form
    (function() {
      try {
        var creds = JSON.parse(atob('${credentialsBase64}'));

        var form = document.createElement('form');
        form.method = 'POST';
        form.action = '${webmailUrl}/?_task=login';
        form.style.display = 'none';

        var fields = {
          '_action': 'login',
          '_task': 'login',
          '_user': creds.user,
          '_pass': creds.pass,
          '_timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          '_url': ''
        };

        for (var key in fields) {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
        }

        document.body.appendChild(form);

        // Submit after a brief delay
        setTimeout(function() {
          form.submit();
        }, 300);
      } catch (e) {
        document.body.innerHTML = '<div style="text-align:center;padding:2rem;"><p style="color:#ef4444;">Error al iniciar sesión</p></div>';
      }
    })();
  </script>
</body>
</html>`;
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
    }
    .error-icon svg {
      width: 30px;
      height: 30px;
      color: #ef4444;
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
    <div class="error-icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h2 class="error-title">Error</h2>
    <p class="error-message">${message}</p>
  </div>
</body>
</html>`;
}
