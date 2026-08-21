import type { GoogleSheetConfig } from '../../core/models';
import { createId } from '../../shared/utils/id';
import { nowIso } from '../../shared/utils/time';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';

export class GoogleSheetConfigRepository {
  async getAll(): Promise<GoogleSheetConfig[]> {
    return chromeStorageArea.getItem<GoogleSheetConfig[]>(STORAGE_KEYS.sheetConfigs, []);
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
    const configs = await this.getAll();
    const nextConfig = { ...config, id: config.id || createId('sheet'), updatedAt: nowIso() };
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

  async create(): Promise<GoogleSheetConfig> {
    const configs = await this.getAll();
    const config: GoogleSheetConfig = {
      id: createId('sheet'),
      name: `Sheet ${configs.length + 1}`,
      sheetUrl: '',
      appScriptUrl: '',
      appScriptToken: '',
      updatedAt: nowIso(),
    };
    return this.save(config);
  }

  async delete(configId: string): Promise<string> {
    const configs = await this.getAll();
    const nextConfigs = configs.filter((config) => config.id !== configId);
    const selectedId = await this.getSelectedId();
    const nextSelectedId = selectedId === configId ? (nextConfigs[0]?.id ?? '') : selectedId;
    await chromeStorageArea.setItem(STORAGE_KEYS.sheetConfigs, nextConfigs);
    await this.setSelectedId(nextSelectedId);
    return nextSelectedId;
  }
}

export const googleSheetConfigRepository = new GoogleSheetConfigRepository();
