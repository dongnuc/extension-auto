import type { GoogleSheetConfig } from '../../core/models';
import { createId } from '../../shared/utils/id';
import { nowIso } from '../../shared/utils/time';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';
import { getConfiguredUserSupabaseClient, throwSupabaseError } from './supabase-repository-utils';

interface GoogleSheetConfigRow {
  id: string;
  name: string;
  sheet_url: string;
  sheet_name: string | null;
  app_script_url: string;
  app_script_token: string;
  updated_at: string;
}

function fromRow(row: GoogleSheetConfigRow): GoogleSheetConfig {
  return {
    id: row.id,
    name: row.name,
    sheetUrl: row.sheet_url,
    sheetName: row.sheet_name ?? '',
    appScriptUrl: row.app_script_url,
    appScriptToken: row.app_script_token,
    updatedAt: row.updated_at,
  };
}

function toRow(config: GoogleSheetConfig): GoogleSheetConfigRow {
  return {
    id: config.id,
    name: config.name,
    sheet_url: config.sheetUrl,
    sheet_name: config.sheetName ?? '',
    app_script_url: config.appScriptUrl,
    app_script_token: config.appScriptToken,
    updated_at: config.updatedAt,
  };
}

export class GoogleSheetConfigRepository {
  async getAll(): Promise<GoogleSheetConfig[]> {
    const client = await getConfiguredUserSupabaseClient();
    if (!client) {
      const configs = await chromeStorageArea.getItem<Array<GoogleSheetConfig & { sheetName?: string }>>(STORAGE_KEYS.sheetConfigs, []);
      return configs.map((config) => ({ ...config, sheetName: config.sheetName ?? '' }));
    }

    const { data, error } = await client.from('google_sheet_configs').select('id, name, sheet_url, sheet_name, app_script_url, app_script_token, updated_at').order('updated_at', { ascending: false });
    throwSupabaseError(error);
    return ((data ?? []) as GoogleSheetConfigRow[]).map(fromRow);
  }

  async getSelectedId(): Promise<string> {
    return chromeStorageArea.getItem<string>(STORAGE_KEYS.selectedSheetConfigId, '');
  }

  async setSelectedId(configId: string): Promise<void> {
    await chromeStorageArea.setItem(STORAGE_KEYS.selectedSheetConfigId, configId);
  }

  async getSelected(): Promise<GoogleSheetConfig | null> {
    const [configs, selectedId] = await Promise.all([this.getAll(), this.getSelectedId()]);
    return configs.find((config) => config.id === selectedId) ?? configs[0] ?? null;
  }

  async save(config: GoogleSheetConfig): Promise<GoogleSheetConfig> {
    const nextConfig = { ...config, id: config.id || createId('sheet'), sheetName: config.sheetName ?? '', updatedAt: nowIso() };
    const client = await getConfiguredUserSupabaseClient();
    if (!client) {
      const configs = await this.getAll();
      const index = configs.findIndex((item) => item.id === nextConfig.id);
      if (index >= 0) {
        configs[index] = nextConfig;
      } else {
        configs.unshift(nextConfig);
      }
      await chromeStorageArea.setItem(STORAGE_KEYS.sheetConfigs, configs);
      await this.setSelectedId(nextConfig.id);
      return nextConfig;
    }

    const { error } = await client.from('google_sheet_configs').upsert(toRow(nextConfig));
    throwSupabaseError(error);
    await this.setSelectedId(nextConfig.id);
    return nextConfig;
  }

  async create(): Promise<GoogleSheetConfig> {
    const configs = await this.getAll();
    const config: GoogleSheetConfig = {
      id: createId('sheet'),
      name: `Sheet ${configs.length + 1}`,
      sheetUrl: '',
      sheetName: '',
      appScriptUrl: '',
      appScriptToken: '',
      updatedAt: nowIso(),
    };
    return this.save(config);
  }

  async delete(configId: string): Promise<string> {
    const client = await getConfiguredUserSupabaseClient();
    if (!client) {
      const configs = await this.getAll();
      const nextConfigs = configs.filter((config) => config.id !== configId);
      const selectedId = await this.getSelectedId();
      const nextSelectedId = selectedId === configId ? (nextConfigs[0]?.id ?? '') : selectedId;
      await chromeStorageArea.setItem(STORAGE_KEYS.sheetConfigs, nextConfigs);
      await this.setSelectedId(nextSelectedId);
      return nextSelectedId;
    }

    const { error } = await client.from('google_sheet_configs').delete().eq('id', configId);
    throwSupabaseError(error);
    const configs = await this.getAll();
    const selectedId = await this.getSelectedId();
    const nextSelectedId = selectedId === configId ? (configs[0]?.id ?? '') : selectedId;
    await this.setSelectedId(nextSelectedId);
    return nextSelectedId;
  }
}

export const googleSheetConfigRepository = new GoogleSheetConfigRepository();
