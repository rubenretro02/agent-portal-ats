import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Generic admin database operation API route
// This bypasses RLS policies that reference the profiles table (causing infinite recursion)
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
    const { action, table, data, filters, select: selectFields, order, match, limit } = body;

    if (!action || !table) {
      return NextResponse.json({ error: 'action and table are required' }, { status: 400 });
    }

    // Allowlist of tables that can be accessed
    const allowedTables = [
      'profiles', 'agents', 'opportunities', 'application_questions',
      'applications', 'application_answers', 'documents', 'notifications',
      'trainings', 'training_progress', 'audit_log',
    ];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: `Table "${table}" not allowed` }, { status: 400 });
    }

    // Use service role client to bypass RLS
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let result;

    switch (action) {
      case 'select': {
        let query = adminSupabase.from(table).select(selectFields || '*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value as string);
          }
        }
        if (order) {
          query = query.order(order.column, { ascending: order.ascending ?? false });
        }
        if (limit) {
          query = query.limit(limit);
        }
        result = await query;
        break;
      }

      case 'select_single': {
        let query = adminSupabase.from(table).select(selectFields || '*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value as string);
          }
        }
        result = await query.single();
        break;
      }

      case 'insert': {
        if (selectFields === false) {
          result = await adminSupabase.from(table).insert(data);
        } else {
          result = await adminSupabase.from(table).insert(data).select();
        }
        break;
      }

      case 'insert_single': {
        result = await adminSupabase.from(table).insert(data).select().single();
        break;
      }

      case 'update': {
        // Build the update query with match/filters, then optionally select
        const baseUpdate = adminSupabase.from(table).update(data);
        let updateQuery = baseUpdate;
        if (match) {
          for (const [key, value] of Object.entries(match)) {
            updateQuery = updateQuery.eq(key, value as string);
          }
        } else if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            updateQuery = updateQuery.eq(key, value as string);
          }
        }
        if (selectFields !== false) {
          result = await updateQuery.select();
        } else {
          result = await updateQuery;
        }
        break;
      }

      case 'delete': {
        let query = adminSupabase.from(table).delete();
        if (match) {
          for (const [key, value] of Object.entries(match)) {
            query = query.eq(key, value as string);
          }
        } else if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value as string);
          }
        }
        result = await query;
        break;
      }

      case 'count': {
        let query = adminSupabase.from(table).select('*', { count: 'exact', head: true });
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value as string);
          }
        }
        result = await query;
        return NextResponse.json({ data: null, count: result.count, error: null });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    if (result.error) {
      console.error(`Admin DB API error [${action} ${table}]:`, result.error.message);
      return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('Admin DB API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
