export class ChromeStorageArea {
  async getItem<T>(key: string, fallback: T): Promise<T> {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? fallback;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }
}

export const chromeStorageArea = new ChromeStorageArea();
