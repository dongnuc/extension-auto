export interface YoutubeTranscriptSegment {
  startMs: number;
  durationMs: number;
  text: string;
}

export interface YoutubeTranscriptResult {
  videoId: string;
  title: string;
  languageCode: string | null;
  segments: YoutubeTranscriptSegment[];
  textNoTimestamp: string;
  textWithTimestamp: string;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
  name?: { simpleText?: string; runs?: Array<{ text?: string }> };
}

interface YoutubePlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  videoDetails?: {
    title?: string;
  };
}

interface Json3CaptionEvent {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

interface Json3CaptionResponse {
  events?: Json3CaptionEvent[];
}

export function extractYoutubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
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
    const match = value.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,})/);
    return match?.[1] ?? null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function youtubeFetch(url: string): Promise<Response> {
  return fetch(url, {
    credentials: 'include',
    headers: {
      Accept: '*/*',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,vi;q=0.7',
    },
  });
}

function extractPlayerResponseFromHtml(html: string): YoutubePlayerResponse | null {
  const marker = 'ytInitialPlayerResponse';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    return null;
  }

  const objectStart = html.indexOf('{', markerIndex);
  if (objectStart < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = objectStart; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const rawJson = html.slice(objectStart, index + 1);
        return JSON.parse(rawJson) as YoutubePlayerResponse;
      }
    }
  }

  return null;
}

async function fetchYoutubeTitle(videoId: string, fallbackTitle: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`);
    if (!response.ok) {
      return fallbackTitle;
    }
    const data = await response.json() as { title?: string };
    return data.title?.trim() || fallbackTitle;
  } catch {
    return fallbackTitle;
  }
}

function getCaptionTrackName(track: CaptionTrack): string {
  return track.name?.simpleText
    ?? track.name?.runs?.map((run) => run.text ?? '').join('').trim()
    ?? '';
}

function getCaptionTrackLabel(track: CaptionTrack, index: number): string {
  const language = track.languageCode ?? 'unknown';
  const kind = track.kind ?? 'manual';
  const name = getCaptionTrackName(track) || 'unnamed';
  return `track${index + 1}:${language}:${kind}:${name}`;
}

function rankCaptionTracks(tracks: CaptionTrack[], preferredLanguage: string): CaptionTrack[] {
  const preferred = preferredLanguage.trim().toLowerCase();
  return [...tracks].sort((left, right) => {
    const leftLanguage = left.languageCode?.toLowerCase() ?? '';
    const rightLanguage = right.languageCode?.toLowerCase() ?? '';
    const leftScore = (leftLanguage === preferred ? 0 : leftLanguage.startsWith(preferred) ? 1 : 2) + (left.kind === 'asr' ? 0.5 : 0);
    const rightScore = (rightLanguage === preferred ? 0 : rightLanguage.startsWith(preferred) ? 1 : 2) + (right.kind === 'asr' ? 0.5 : 0);
    return leftScore - rightScore;
  });
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function parseJson3Segments(rawText: string): YoutubeTranscriptSegment[] {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return [];
  }

  const data = JSON.parse(trimmed) as Json3CaptionResponse;
  return (data.events ?? [])
    .filter((event) => event.segs?.length)
    .map((event) => ({
      startMs: event.tStartMs ?? 0,
      durationMs: event.dDurationMs ?? 0,
      text: (event.segs ?? []).map((segment) => segment.utf8 ?? '').join('').replace(/\s+/g, ' ').trim(),
    }))
    .filter((segment) => segment.text.length > 0);
}

function parseXmlTranscriptSegments(rawText: string): YoutubeTranscriptSegment[] {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return [];
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(trimmed, 'text/xml');
  const parseError = document.querySelector('parsererror');
  if (parseError) {
    return [];
  }

  return Array.from(document.querySelectorAll('text, p'))
    .map((node) => ({
      startMs: Math.round(Number(node.getAttribute('start') ?? node.getAttribute('t') ?? '0') * (node.hasAttribute('t') ? 1 : 1000)),
      durationMs: Math.round(Number(node.getAttribute('dur') ?? node.getAttribute('d') ?? '0') * (node.hasAttribute('d') ? 1 : 1000)),
      text: (node.textContent ?? '').replace(/\s+/g, ' ').trim(),
    }))
    .filter((segment) => segment.text.length > 0);
}

function parseVttTimestamp(value: string): number {
  const parts = value.trim().split(':');
  const secondsPart = parts.pop() ?? '0';
  const seconds = Number(secondsPart.replace(',', '.'));
  const minutes = Number(parts.pop() ?? '0');
  const hours = Number(parts.pop() ?? '0');
  return Math.round(((hours * 3600) + (minutes * 60) + seconds) * 1000);
}

function parseVttTranscriptSegments(rawText: string): YoutubeTranscriptSegment[] {
  const trimmed = rawText.trim();
  if (!trimmed || !trimmed.includes('-->')) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/);
  const segments: YoutubeTranscriptSegment[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.includes('-->')) {
      continue;
    }

    const [startRaw, endRaw] = line.split('-->').map((part) => part.trim().split(/\s+/)[0]);
    const startMs = parseVttTimestamp(startRaw);
    const endMs = parseVttTimestamp(endRaw);
    const textLines: string[] = [];
    index += 1;
    while (index < lines.length && lines[index].trim()) {
      textLines.push(lines[index].replace(/<[^>]+>/g, '').trim());
      index += 1;
    }

    const text = textLines.join(' ').replace(/\s+/g, ' ').trim();
    if (text) {
      segments.push({
        startMs,
        durationMs: Math.max(0, endMs - startMs),
        text,
      });
    }
  }

  return segments;
}

function buildTranscriptFetchVariants(baseUrl: string): Array<{ label: string; url: string; parser: 'json3' | 'xml' | 'vtt' }> {
  const decodedBaseUrl = decodeHtmlEntities(baseUrl);
  const variants: Array<{ label: string; url: string; parser: 'json3' | 'xml' | 'vtt' }> = [];

  const pushVariant = (label: string, mutate: (url: URL) => void, parser: 'json3' | 'xml' | 'vtt') => {
    const url = new URL(decodedBaseUrl);
    mutate(url);
    variants.push({ label, url: url.toString(), parser });
  };

  pushVariant('base-original', () => undefined, 'xml');
  pushVariant('fmt-json3', (url) => url.searchParams.set('fmt', 'json3'), 'json3');
  pushVariant('fmt-xml', (url) => url.searchParams.delete('fmt'), 'xml');
  pushVariant('fmt-srv3', (url) => url.searchParams.set('fmt', 'srv3'), 'xml');
  pushVariant('fmt-vtt', (url) => url.searchParams.set('fmt', 'vtt'), 'vtt');

  return variants.filter((variant, index, self) => self.findIndex((item) => item.url === variant.url) === index);
}

function parseTranscriptByVariant(parserType: 'json3' | 'xml' | 'vtt', rawText: string): YoutubeTranscriptSegment[] {
  if (parserType === 'json3') {
    return parseJson3Segments(rawText);
  }
  if (parserType === 'vtt') {
    return parseVttTranscriptSegments(rawText);
  }
  return parseXmlTranscriptSegments(rawText);
}

async function fetchTranscriptSegments(track: CaptionTrack): Promise<YoutubeTranscriptSegment[]> {
  const attempts: string[] = [];
  for (const variant of buildTranscriptFetchVariants(track.baseUrl)) {
    try {
      const response = await youtubeFetch(variant.url);
      if (!response.ok) {
        attempts.push(`${variant.label}:HTTP_${response.status}`);
        continue;
      }

      const rawText = await response.text();
      if (!rawText.trim()) {
        attempts.push(`${variant.label}:EMPTY`);
        continue;
      }

      const segments = parseTranscriptByVariant(variant.parser, rawText);
      if (segments.length > 0) {
        return segments;
      }

      attempts.push(`${variant.label}:NO_SEGMENTS_${rawText.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      attempts.push(`${variant.label}:${message}`);
    }
  }

  throw new Error(`TRANSCRIPT_PARSE_FAILED|${attempts.join('|')}`.slice(0, 500));
}

function extractQuotedConfigValue(html: string, key: string): string | null {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`"${escapedKey}"\\s*:\\s*"([^"]+)"`));
  return match?.[1] ? decodeHtmlEntities(match[1]) : null;
}

function extractJsonAfterMarker<T>(html: string, marker: string): T | null {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    return null;
  }

  const objectStart = html.indexOf('{', markerIndex);
  if (objectStart < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = objectStart; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(objectStart, index + 1)) as T;
      }
    }
  }

  return null;
}

function collectTranscriptParams(value: unknown, output: string[] = []): string[] {
  if (!value || typeof value !== 'object') {
    return output;
  }

  if ('transcriptEndpoint' in value) {
    const endpoint = (value as { transcriptEndpoint?: { params?: unknown } }).transcriptEndpoint;
    if (typeof endpoint?.params === 'string' && endpoint.params) {
      output.push(endpoint.params);
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTranscriptParams(item, output);
    }
    return output;
  }

  for (const child of Object.values(value)) {
    collectTranscriptParams(child, output);
  }
  return output;
}

function extractCueText(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const cue = (value as { cue?: { simpleText?: string; runs?: Array<{ text?: string }> } }).cue;
  return cue?.simpleText ?? cue?.runs?.map((run) => run.text ?? '').join('') ?? '';
}

function collectInnertubeCueSegments(value: unknown, output: YoutubeTranscriptSegment[] = []): YoutubeTranscriptSegment[] {
  if (!value || typeof value !== 'object') {
    return output;
  }

  if ('transcriptCueRenderer' in value) {
    const cueRenderer = (value as {
      transcriptCueRenderer?: {
        cue?: { simpleText?: string; runs?: Array<{ text?: string }> };
        startOffsetMs?: string;
        durationMs?: string;
      };
    }).transcriptCueRenderer;
    const text = extractCueText(cueRenderer).replace(/\s+/g, ' ').trim();
    if (cueRenderer && text) {
      output.push({
        startMs: Number(cueRenderer.startOffsetMs ?? '0'),
        durationMs: Number(cueRenderer.durationMs ?? '0'),
        text,
      });
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectInnertubeCueSegments(item, output);
    }
    return output;
  }

  for (const child of Object.values(value)) {
    collectInnertubeCueSegments(child, output);
  }
  return output;
}

async function fetchYoutubeiPlayerCaptionTracks(html: string, videoId: string): Promise<CaptionTrack[]> {
  const apiKey = extractQuotedConfigValue(html, 'INNERTUBE_API_KEY');
  const htmlClientName = extractQuotedConfigValue(html, 'INNERTUBE_CLIENT_NAME') ?? 'WEB';
  const htmlClientVersion = extractQuotedConfigValue(html, 'INNERTUBE_CLIENT_VERSION');
  const visitorData = extractQuotedConfigValue(html, 'VISITOR_DATA');

  if (!apiKey || !htmlClientVersion) {
    throw new Error(`PLAYER_API_UNAVAILABLE|apiKey=${apiKey ? 'yes' : 'no'}|clientVersion=${htmlClientVersion ? 'yes' : 'no'}`);
  }

  const clientCandidates = [
    { label: 'html-web', clientName: htmlClientName, clientVersion: htmlClientVersion, clientHeaderName: '1' },
    { label: 'web', clientName: 'WEB', clientVersion: htmlClientVersion, clientHeaderName: '1' },
    { label: 'web-embed', clientName: 'WEB_EMBEDDED_PLAYER', clientVersion: htmlClientVersion, clientHeaderName: '56' },
    { label: 'ios', clientName: 'IOS', clientVersion: '20.10.4', clientHeaderName: '5' },
    { label: 'android', clientName: 'ANDROID', clientVersion: '19.09.37', clientHeaderName: '3' },
  ];
  const errors: string[] = [];

  for (const candidate of clientCandidates) {
    try {
      const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: '*/*',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,vi;q=0.7',
          'Content-Type': 'application/json',
          'X-YouTube-Client-Name': candidate.clientHeaderName,
          'X-YouTube-Client-Version': candidate.clientVersion,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: candidate.clientName,
              clientVersion: candidate.clientVersion,
              visitorData: visitorData ?? undefined,
              hl: 'ja',
              gl: 'JP',
            },
          },
          videoId,
          playbackContext: {
            contentPlaybackContext: {
              html5Preference: 'HTML5_PREF_WANTS',
            },
          },
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });

      if (!response.ok) {
        errors.push(`${candidate.label}:HTTP_${response.status}`);
        continue;
      }

      const rawText = await response.text();
      if (!rawText.trim()) {
        errors.push(`${candidate.label}:EMPTY`);
        continue;
      }

      const playerResponse = JSON.parse(rawText) as YoutubePlayerResponse;
      const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (tracks.length > 0) {
        return tracks;
      }
      errors.push(`${candidate.label}:NO_CAPTION_TRACKS`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      errors.push(`${candidate.label}:${message}`);
    }
  }

  throw new Error(`PLAYER_API_FAILED|${errors.join('|')}`.slice(0, 700));
}

async function fetchInnertubeTranscriptSegments(html: string): Promise<YoutubeTranscriptSegment[]> {
  const apiKey = extractQuotedConfigValue(html, 'INNERTUBE_API_KEY');
  const clientName = extractQuotedConfigValue(html, 'INNERTUBE_CLIENT_NAME') ?? 'WEB';
  const clientVersion = extractQuotedConfigValue(html, 'INNERTUBE_CLIENT_VERSION');
  const visitorData = extractQuotedConfigValue(html, 'VISITOR_DATA');
  const initialData = extractJsonAfterMarker<unknown>(html, 'ytInitialData');
  const params = [...new Set(collectTranscriptParams(initialData))];

  if (!apiKey || !clientVersion || params.length === 0) {
    throw new Error(`INNERTUBE_TRANSCRIPT_UNAVAILABLE|apiKey=${apiKey ? 'yes' : 'no'}|clientVersion=${clientVersion ? 'yes' : 'no'}|params=${params.length}`);
  }

  const errors: string[] = [];
  for (const param of params) {
    try {
      const response = await fetch(`https://www.youtube.com/youtubei/v1/get_transcript?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: '*/*',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,vi;q=0.7',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName,
              clientVersion,
              visitorData: visitorData ?? undefined,
            },
          },
          params: param,
        }),
      });

      if (!response.ok) {
        errors.push(`HTTP_${response.status}`);
        continue;
      }

      const rawText = await response.text();
      if (!rawText.trim()) {
        errors.push('EMPTY');
        continue;
      }

      const segments = collectInnertubeCueSegments(JSON.parse(rawText));
      if (segments.length > 0) {
        return segments;
      }
      errors.push(`NO_CUES_${rawText.length}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'UNKNOWN');
    }
  }

  throw new Error(`INNERTUBE_TRANSCRIPT_FAILED|${errors.join('|')}`.slice(0, 700));
}

export async function fetchYoutubeTranscript(url: string, preferredLanguage = 'ja'): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('INVALID_YOUTUBE_URL');
  }

  const watchResponse = await youtubeFetch(`https://www.youtube.com/watch?v=${videoId}&hl=ja&persist_hl=1`);
  if (!watchResponse.ok) {
    throw new Error(`YOUTUBE_PAGE_FETCH_FAILED_${watchResponse.status}`);
  }

  const html = await watchResponse.text();
  const playerResponse = extractPlayerResponseFromHtml(html);
  if (!playerResponse) {
    throw new Error('PLAYER_RESPONSE_NOT_FOUND');
  }

  const fallbackTitle = playerResponse.videoDetails?.title?.trim() || '';
  const title = await fetchYoutubeTitle(videoId, fallbackTitle);
  const htmlTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const allTrackErrors: string[] = [];
  let selectedTrack: CaptionTrack | null = null;
  let segments: YoutubeTranscriptSegment[] = [];

  const tryCaptionTracks = async (source: string, sourceTracks: CaptionTrack[]) => {
    const rankedTracks = rankCaptionTracks(sourceTracks, preferredLanguage);
    for (const track of rankedTracks) {
      try {
        segments = await fetchTranscriptSegments(track);
        if (segments.length > 0) {
          selectedTrack = track;
          return true;
        }
      } catch (error) {
        const originalIndex = sourceTracks.indexOf(track);
        const message = error instanceof Error ? error.message : 'UNKNOWN';
        allTrackErrors.push(`${source}:${getCaptionTrackLabel(track, originalIndex)}=>${message}`);
      }
    }
    return false;
  };

  if (htmlTracks.length > 0) {
    await tryCaptionTracks('html', htmlTracks);
  }

  if (!selectedTrack || segments.length === 0) {
    try {
      const playerApiTracks = await fetchYoutubeiPlayerCaptionTracks(html, videoId);
      if (playerApiTracks.length > 0) {
        await tryCaptionTracks('player-api', playerApiTracks);
      } else {
        allTrackErrors.push('player-api:NO_CAPTION_TRACKS');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      allTrackErrors.push(`player-api=>${message}`);
    }
  }

  if (!selectedTrack || segments.length === 0) {
    try {
      segments = await fetchInnertubeTranscriptSegments(html);
      if (segments.length > 0) {
        selectedTrack = htmlTracks[0] ?? null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      throw new Error(`NO_USABLE_TRANSCRIPT_TRACK|htmlTracks=${htmlTracks.length}|${allTrackErrors.join('||')}||innertube=>${message}`.slice(0, 1200));
    }
  }

  if (!selectedTrack || segments.length === 0) {
    throw new Error(`NO_USABLE_TRANSCRIPT_TRACK|htmlTracks=${htmlTracks.length}|${allTrackErrors.join('||')}`.slice(0, 900));
  }

  return {
    videoId,
    title,
    languageCode: selectedTrack.languageCode ?? null,
    segments,
    textNoTimestamp: segments.map((segment) => segment.text).join('\n'),
    textWithTimestamp: segments.map((segment) => `[${formatTimestamp(segment.startMs)}] ${segment.text}`).join('\n'),
  };
}
