import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated
    const serverSupabase = await createServerSupabaseClient();
    if (!serverSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { first_name, middle_name, last_name, sex, date_of_birth, phone, username } = body;

    // Validate: at least one field must be provided
    if (!first_name && !last_name && !phone && !username && !sex && !date_of_birth) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    // Use service role to bypass RLS
    let supabaseForUpdate;
    if (SUPABASE_SERVICE_ROLE_KEY) {
      supabaseForUpdate = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    } else {
      // Fallback to server client
      supabaseForUpdate = serverSupabase;
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {};
    if (first_name !== undefined) updateFields.first_name = first_name;
    if (middle_name !== undefined) updateFields.middle_name = middle_name || null;
    if (last_name !== undefined) updateFields.last_name = last_name;
    if (sex !== undefined) updateFields.sex = sex || null;
    if (date_of_birth !== undefined) updateFields.date_of_birth = date_of_birth || null;
    if (phone !== undefined) updateFields.phone = phone || null;
    if (username !== undefined) updateFields.username = username;

    const { data, error: updateError } = await supabaseForUpdate
      .from('profiles')
      .update(updateFields)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError.code, updateError.message);
      return NextResponse.json({ error: updateError.message, code: updateError.code }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
