import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Use service role client to bypass RLS
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Try case-insensitive lookup first
    const { data: profileData, error: lookupError } = await adminSupabase
      .from('profiles')
      .select('email')
      .ilike('username', username)
      .single();

    if (!lookupError && profileData) {
      return NextResponse.json({ email: profileData.email });
    }

    // Try exact match
    const { data: profileData2, error: lookupError2 } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();

    if (!lookupError2 && profileData2) {
      return NextResponse.json({ email: profileData2.email });
    }

    return NextResponse.json({ error: 'Username not found' }, { status: 404 });
  } catch (error) {
    console.error('Username lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
