// Client-side helper for admin database operations
// Bypasses RLS policies via server-side service role key

interface AdminDbOptions {
  action: 'select' | 'select_single' | 'insert' | 'insert_single' | 'update' | 'delete' | 'count';
  table: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  filters?: Record<string, unknown>;
  match?: Record<string, unknown>;
  select?: string | false;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

interface AdminDbResult<T = unknown> {
  data: T | null;
  error: string | null;
  count?: number;
}

export async function adminDb<T = unknown>(options: AdminDbOptions): Promise<AdminDbResult<T>> {
  try {
    const res = await fetch('/api/admin/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const result = await res.json();

    if (!res.ok) {
      return { data: null, error: result.error || 'Request failed' };
    }

    return { data: result.data as T, error: null, count: result.count };
  } catch (error) {
    console.error('adminDb error:', error);
    return { data: null, error: 'Network error' };
  }
}
