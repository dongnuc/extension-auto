import { runtimeMessageTypes, type YoutubeTranscriptPageData } from '../shared/messaging/contracts';

interface YoutubeTabExtractionResult extends YoutubeTranscriptPageData {
  videoId: string | null;
}

function extractYoutubeVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? null;
    }
    if (!host.endsWith('youtube.com')) {
      return null;
    }
    if (url.pathname === '/watch') {
      return url.searchParams.get('v');
    }
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live'].includes(pathParts[0])) {
      return pathParts[1] ?? null;
    }
    return null;
  } catch {
    const trimmed = input.trim();
    const match = trimmed.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)?([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTabLoaded(tabId: number, timeoutMs = 30000): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      await sleep(1200);
      return;
    }
    await sleep(500);
  }
  throw new Error('YOUTUBE_TAB_LOAD_TIMEOUT');
}

async function sendExtractMessage(tabId: number): Promise<YoutubeTranscriptPageData> {
  const response = await chrome.tabs.sendMessage(tabId, {
    type: runtimeMessageTypes.extractYoutubeTranscriptFromPage,
  }) as { ok?: boolean; data?: YoutubeTranscriptPageData; message?: string } | undefined;

  if (!response?.ok || !response.data) {
    throw new Error(response?.message || 'YOUTUBE_CONTENT_SCRIPT_NO_RESPONSE');
  }
  return response.data;
}

export async function extractYoutubeTranscriptByTab(url: string): Promise<YoutubeTabExtractionResult> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('INVALID_YOUTUBE_URL');
  }

  const normalizedUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=ja&persist_hl=1`;
  const tab = await chrome.tabs.create({ url: normalizedUrl, active: false });
  if (!tab.id) {
    throw new Error('YOUTUBE_TAB_CREATE_FAILED');
  }

  try {
    await waitForTabLoaded(tab.id);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/youtube-content.ts'],
      });
    } catch {
      // The content script may already be injected by manifest; continue and try messaging.
    }

    let lastError = 'YOUTUBE_CONTENT_SCRIPT_NOT_READY';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const data = await sendExtractMessage(tab.id);
        return { ...data, videoId };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'YOUTUBE_CONTENT_SCRIPT_NOT_READY';
        await sleep(1000);
      }
    }
    throw new Error(lastError);
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => undefined);
  }
}
