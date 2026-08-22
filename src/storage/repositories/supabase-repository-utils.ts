import type { SupabaseClient } from '@supabase/supabase-js';
import type { CachedSupabaseProjectConfig } from '../../core/models';
import { getUserSupabaseClient } from '../../supabase/user-client';
import { userSupabaseConfigRepository } from './user-supabase-config-repository';

export async function getConfiguredUserSupabaseClient(): Promise<SupabaseClient | null> {
  const config = await userSupabaseConfigRepository.getCached();
  if (!config?.projectUrl || !config.anonKey) {
    return null;
  }
  return getUserSupabaseClient(config as CachedSupabaseProjectConfig);
}

export function throwSupabaseError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}
