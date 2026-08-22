import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CachedSupabaseProjectConfig } from '../core/models';
import { extensionSupabaseFetch } from './extension-fetch';

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

function normalizeProjectUrl(projectUrl: string): string {
  return projectUrl.trim().replace(/\/+$/, '');
}

export function getUserSupabaseClient(config: CachedSupabaseProjectConfig): SupabaseClient {
  const projectUrl = normalizeProjectUrl(config.projectUrl);
  const cacheKey = `${projectUrl}::${config.anonKey}`;
  if (cachedClient && cachedKey === cacheKey) {
    return cachedClient;
  }

  cachedClient = createClient(projectUrl, config.anonKey, {
    global: {
      fetch: extensionSupabaseFetch,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  cachedKey = cacheKey;
  return cachedClient;
}

export async function testUserSupabaseConnection(config: CachedSupabaseProjectConfig): Promise<void> {
  const client = getUserSupabaseClient(config);
  const { error } = await client.from('script_batches').select('id').limit(1);
  if (error) {
    throw new Error(error.message);
  }
}
