import type { CachedSupabaseProjectConfig, UserSupabaseProjectConfig } from '../../core/models';
import { centralSupabase } from '../../supabase/central-client';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';

interface UserSupabaseProjectRow {
  user_id: string;
  project_url: string;
  anon_key: string;
  created_at?: string;
  updated_at?: string;
}

function fromRow(row: UserSupabaseProjectRow): UserSupabaseProjectConfig {
  return {
    userId: row.user_id,
    projectUrl: row.project_url,
    anonKey: row.anon_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserSupabaseConfigRepository {
  async getCached(): Promise<CachedSupabaseProjectConfig | null> {
    return chromeStorageArea.getItem<CachedSupabaseProjectConfig | null>(STORAGE_KEYS.userSupabaseProjectConfig, null);
  }

  async setCached(config: CachedSupabaseProjectConfig | null): Promise<void> {
    if (!config) {
      await chromeStorageArea.removeItem(STORAGE_KEYS.userSupabaseProjectConfig);
      return;
    }
    await chromeStorageArea.setItem(STORAGE_KEYS.userSupabaseProjectConfig, config);
  }

  async getRemote(userId: string): Promise<UserSupabaseProjectConfig | null> {
    const { data, error } = await centralSupabase
      .from('user_supabase_projects')
      .select('user_id, project_url, anon_key, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle<UserSupabaseProjectRow>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    const config = fromRow(data);
    await this.setCached({ projectUrl: config.projectUrl, anonKey: config.anonKey });
    return config;
  }

  async saveRemote(userId: string, config: CachedSupabaseProjectConfig): Promise<UserSupabaseProjectConfig> {
    const payload: UserSupabaseProjectRow = {
      user_id: userId,
      project_url: config.projectUrl.trim().replace(/\/+$/, ''),
      anon_key: config.anonKey.trim(),
    };

    const { data, error } = await centralSupabase
      .from('user_supabase_projects')
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id, project_url, anon_key, created_at, updated_at')
      .single<UserSupabaseProjectRow>();

    if (error) {
      throw new Error(error.message);
    }

    const saved = fromRow(data);
    await this.setCached({ projectUrl: saved.projectUrl, anonKey: saved.anonKey });
    return saved;
  }
}

export const userSupabaseConfigRepository = new UserSupabaseConfigRepository();
