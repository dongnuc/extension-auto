import type { GemProfile } from '../../core/models';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';

export class ProfileRepository {
  async getAll(): Promise<GemProfile[]> {
    return chromeStorageArea.getItem<GemProfile[]>(STORAGE_KEYS.profiles, []);
  }

  async getById(id: string): Promise<GemProfile | null> {
    const profiles = await this.getAll();
    return profiles.find((profile) => profile.id === id) ?? null;
  }

  async save(profile: GemProfile): Promise<void> {
    const profiles = await this.getAll();
    const index = profiles.findIndex((item) => item.id === profile.id);

    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }

    await chromeStorageArea.setItem(STORAGE_KEYS.profiles, profiles);
  }

  async delete(id: string): Promise<void> {
    const profiles = await this.getAll();
    await chromeStorageArea.setItem(
      STORAGE_KEYS.profiles,
      profiles.filter((profile) => profile.id !== id),
    );
  }
}

export const profileRepository = new ProfileRepository();
