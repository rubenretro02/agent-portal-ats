import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Función para validar si es una URL válida
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip middleware if Supabase is not configured or URL is invalid
  if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey.length < 10) {
    console.warn('Supabase not configured or invalid. Skipping auth middleware.');
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes for agents
  const agentProtectedPaths = ['/dashboard', '/opportunities', '/onboarding', '/documents', '/messages', '/profile', '/settings'];
  const isAgentProtectedPath = agentProtectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Protected routes for admins
  const adminProtectedPaths = ['/admin'];
  const isAdminProtectedPath = adminProtectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path) && !request.nextUrl.pathname.includes('/admin/login')
  );

  // Unauthenticated users on any protected route → unified login at root.
  if (!user && (isAgentProtectedPath || isAdminProtectedPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Authenticated users on an auth route (root login, legacy login, register)
  // → role home. AuthProvider/getRoleHomePath keep this in sync.
  const authRoutes = ['/', '/login', '/admin/login', '/register'];
  if (user && authRoutes.includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
