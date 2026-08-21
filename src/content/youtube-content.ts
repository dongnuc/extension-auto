import { runtimeMessageTypes, type YoutubeTranscriptPageData } from '../shared/messaging/contracts';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function getVideoTitle(): string {
  const metaTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content?.trim();
  if (metaTitle) {
    return metaTitle;
  }
  const title = document.querySelector<HTMLElement>('h1 yt-formatted-string, h1.title')?.textContent?.trim();
  return title || document.title.replace(/ - YouTube$/, '').trim();
}

function parseTimestampToMs(value: string): number {
  const parts = value.trim().split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) {
    return 0;
  }
  if (parts.length === 3) {
    return ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000;
  }
  if (parts.length === 2) {
    return ((parts[0] * 60) + parts[1]) * 1000;
  }
  return (parts[0] ?? 0) * 1000;
}

function getTranscriptSegments(): YoutubeTranscriptPageData['segments'] {
  const segmentNodes = Array.from(document.querySelectorAll<HTMLElement>('ytd-transcript-segment-renderer, yt-transcript-segment-renderer, [class*="transcript-segment"]'));
  const segments = segmentNodes
    .map((node) => {
      const timestamp = normalizeText(
        node.querySelector<HTMLElement>('.segment-timestamp, [class*="timestamp"], yt-formatted-string:first-child')?.textContent ?? '',
      );
      const text = normalizeText(
        node.querySelector<HTMLElement>('.segment-text, yt-formatted-string.segment-text, [class*="segment-text"]')?.textContent
        ?? node.textContent
        ?? '',
      ).replace(timestamp, '').trim();
      return {
        startMs: parseTimestampToMs(timestamp),
        durationMs: 0,
        timestamp,
        text,
      };
    })
    .filter((segment) => segment.text.length > 0);

  const seen = new Set<string>();
  return segments.filter((segment) => {
    const key = `${segment.timestamp}|${segment.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function findClickableByText(patterns: RegExp[]): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('button, a, tp-yt-paper-button, tp-yt-paper-item, ytd-menu-service-item-renderer, ytd-button-renderer, yt-button-shape, [role="button"]'));
  return candidates.find((element) => {
    const text = normalizeText(`${element.textContent ?? ''} ${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''}`);
    return patterns.some((pattern) => pattern.test(text));
  }) ?? null;
}

function getTranscriptTextPatterns(): RegExp[] {
  return [
    /show transcript/i,
    /open transcript/i,
    /transcript/i,
    /文字起こし/,
    /文字おこし/,
    /文字起こしを表示/,
    /bản chép lời/i,
    /hiển thị bản chép lời/i,
  ];
}

async function clickIfExists(element: HTMLElement | null): Promise<boolean> {
  if (!element) {
    return false;
  }
  element.scrollIntoView({ block: 'center', inline: 'center' });
  await sleep(150);
  element.click();
  await sleep(700);
  return true;
}

async function expandDescription(): Promise<void> {
  const expanders = Array.from(document.querySelectorAll<HTMLElement>('#expand, tp-yt-paper-button#expand, ytd-text-inline-expander #expand, [aria-label*="more" i], [aria-label*="thêm" i], [aria-label*="もっと" i]'));
  for (const expander of expanders.slice(0, 3)) {
    await clickIfExists(expander);
  }
}

async function openTranscriptPanel(): Promise<void> {
  if (getTranscriptSegments().length > 0) {
    return;
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
  await sleep(500);
  await expandDescription();

  const transcriptSelectors = [
    'ytd-video-description-transcript-section-renderer button',
    'ytd-video-description-transcript-section-renderer [role="button"]',
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] button',
    'button[aria-label*="transcript" i]',
    'button[aria-label*="文字起こし" i]',
  ];

  for (const selector of transcriptSelectors) {
    if (await clickIfExists(document.querySelector<HTMLElement>(selector))) {
      if ((await waitForTranscriptSegments(3000)).length > 0) {
        return;
      }
    }
  }

  const directTranscriptButton = findClickableByText(getTranscriptTextPatterns());
  if (await clickIfExists(directTranscriptButton)) {
    if ((await waitForTranscriptSegments(4000)).length > 0) {
      return;
    }
  }

  const menuButtons = Array.from(document.querySelectorAll<HTMLElement>([
    'ytd-menu-renderer yt-icon-button button',
    '#top-level-buttons-computed + yt-button-shape button',
    'button[aria-label*="More actions" i]',
    'button[aria-label*="その他" i]',
    'button[aria-label*="その他の操作" i]',
  ].join(',')));

  for (const menuButton of menuButtons.slice(0, 3)) {
    if (!await clickIfExists(menuButton)) {
      continue;
    }
    const menuTranscriptItem = findClickableByText(getTranscriptTextPatterns())
      ?? Array.from(document.querySelectorAll<HTMLElement>('ytd-menu-service-item-renderer, tp-yt-paper-item, yt-formatted-string'))
        .find((item) => /transcript|文字起こし|文字おこし|bản chép lời/i.test(normalizeText(item.textContent ?? '')))
      ?? null;
    if (await clickIfExists(menuTranscriptItem)) {
      if ((await waitForTranscriptSegments(5000)).length > 0) {
        return;
      }
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(300);
  }
}

async function waitForTranscriptSegments(timeoutMs = 15000): Promise<YoutubeTranscriptPageData['segments']> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const segments = getTranscriptSegments();
    if (segments.length > 0) {
      return segments;
    }
    await sleep(500);
  }
  return [];
}

async function extractYoutubeTranscriptFromPage(): Promise<YoutubeTranscriptPageData> {
  await openTranscriptPanel();
  const segments = await waitForTranscriptSegments();
  if (segments.length === 0) {
    throw new Error('YOUTUBE_TRANSCRIPT_DOM_NOT_FOUND');
  }

  return {
    title: getVideoTitle(),
    url: window.location.href,
    segments,
    textNoTimestamp: segments.map((segment) => segment.text).join('\n'),
    textWithTimestamp: segments.map((segment) => `[${segment.timestamp || '0:00'}] ${segment.text}`).join('\n'),
  };
}

chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
  if (message.type !== runtimeMessageTypes.extractYoutubeTranscriptFromPage) {
    return false;
  }

  void extractYoutubeTranscriptFromPage()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error: unknown) => sendResponse({ ok: false, message: error instanceof Error ? error.message : 'YOUTUBE_TRANSCRIPT_EXTRACTION_FAILED' }));
  return true;
});
