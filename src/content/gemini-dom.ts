const SELECTORS = {
  editor: [
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    'rich-textarea div[contenteditable="true"]',
  ],
  sendButton: [
    'button[aria-label*="Send"]',
    'button[aria-label*="Gửi"]',
    'button[data-test-id="send-button"]',
  ],
  stopButton: [
    'button[aria-label*="Stop"]',
    'button[aria-label*="Dừng"]',
  ],
  responseContainer: [
    'model-response',
    '[data-response-id]',
    '.model-response-text',
    '.markdown[data-response-id]',
    '.markdown',
  ],
  gemTitle: [
    'h1',
    'header h1',
    '[data-test-id="conversation-title"]',
  ],
  errorBanners: [
    '[role="alert"]',
    '.error',
    '.warning',
  ],
};

function queryFirst(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForEditorReady(timeoutMs = 30000): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const editor = queryFirst(SELECTORS.editor);
    if (editor && editor.isConnected) {
      return editor;
    }
    await wait(300);
  }
  throw new Error('EDITOR_NOT_READY');
}

export function getGemName(): string {
  const title = queryFirst(SELECTORS.gemTitle)?.textContent?.trim();
  return title || document.title || '';
}

export function getSendButton(): HTMLButtonElement | null {
  return queryFirst(SELECTORS.sendButton) as HTMLButtonElement | null;
}

export function getStopButton(): HTMLButtonElement | null {
  return queryFirst(SELECTORS.stopButton) as HTMLButtonElement | null;
}

export function isGenerating(): boolean {
  return Boolean(getStopButton());
}

export function isSendReady(): boolean {
  const button = getSendButton();
  return Boolean(button && !button.disabled);
}

export function isBusyProcessing(): boolean {
  return isGenerating() || !isSendReady();
}

export function getResponseTexts(): string[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.responseContainer.join(',')));
  const seen = new Set<string>();
  const results: string[] = [];

  for (const node of nodes) {
    const text = node.innerText.trim();
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    results.push(text);
  }

  return results;
}

export function getLatestResponseText(): string {
  return getResponseTexts().at(-1) ?? '';
}

export function getResponseSignature(): string {
  return getResponseTexts()
    .map((text, index) => `${index}:${text.length}:${text.slice(0, 80)}`)
    .join('||');
}

export function captureLatestResponse(): string {
  return getLatestResponseText().trim();
}

export function captureAllResponses(): string {
  return getResponseTexts().join('\n\n').trim();
}

export function extractJapaneseScriptBlocks(input: string): string[] {
  const normalized = input.trim();
  if (!normalized) {
    return [];
  }

  const fencedBlocks = Array.from(normalized.matchAll(/```(?:[\w-]+)?\n([\s\S]*?)```/g))
    .map((match) => match[1]?.trim() ?? '')
    .filter(Boolean);

  const sourceBlocks = fencedBlocks.length > 0 ? fencedBlocks : normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return sourceBlocks.filter((block) => /[\u3040-\u30ff\u4e00-\u9faf]/.test(block));
}

export async function waitForResponseCaptureAfterSendReady(timeoutMs = 5000): Promise<string> {
  const start = Date.now();
  let lastText = captureLatestResponse();
  let lastChangeAt = Date.now();

  while (Date.now() - start < timeoutMs) {
    const error = detectGeminiError();
    if (error) {
      throw new Error(error);
    }

    const latest = captureLatestResponse();
    if (latest !== lastText) {
      lastText = latest;
      lastChangeAt = Date.now();
    }

    if (Date.now() - lastChangeAt >= 500) {
      return lastText;
    }

    await wait(200);
  }

  return captureLatestResponse();
}

export function detectGeminiError(): string | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.errorBanners.join(',')));
  const text = nodes.map((node) => node.innerText.trim()).find(Boolean) ?? '';
  if (!text) {
    return null;
  }
  if (/sign in|đăng nhập/i.test(text)) {
    return 'LOGIN_REQUIRED';
  }
  if (/limit|quota|usage/i.test(text)) {
    return 'USAGE_LIMIT_REACHED';
  }
  if (/network|kết nối|try again|something went wrong/i.test(text)) {
    return 'NETWORK_OR_GENERATION_ERROR';
  }
  return 'GEMINI_ERROR';
}

export function focusEditor(editor: HTMLElement): void {
  editor.focus();
}

export function clearEditor(editor: HTMLElement): void {
  editor.textContent = '';
  editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
}

export function insertText(editor: HTMLElement, text: string): void {
  editor.textContent = text;
  editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
}

export function verifyInsertedContent(editor: HTMLElement, text: string): boolean {
  return (editor.textContent ?? '').trim().length === text.trim().length;
}

export async function waitForSendReady(timeoutMs = 10000): Promise<HTMLButtonElement> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const error = detectGeminiError();
    if (error) {
      throw new Error(error);
    }

    const button = getSendButton();
    if (button && !button.disabled) {
      return button;
    }
    await wait(200);
  }
  throw new Error('SEND_BUTTON_NOT_READY');
}

export function clickSend(button: HTMLButtonElement): void {
  button.focus();
  button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
  button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
  button.click();
}

export async function waitForGenerationStart(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  let sendReadySeenAfterClick = isSendReady();

  while (Date.now() - start < timeoutMs) {
    const error = detectGeminiError();
    if (error) {
      throw new Error(error);
    }

    if (isGenerating()) {
      return true;
    }

    const sendReady = isSendReady();
    if (!sendReady) {
      return false;
    }

    sendReadySeenAfterClick = sendReadySeenAfterClick || sendReady;
    await wait(200);
  }

  throw new Error(`GENERATION_NOT_STARTED|sendReady=${String(isSendReady())}|busyProcessing=${String(isBusyProcessing())}|sendReadySeenAfterClick=${String(sendReadySeenAfterClick)}`);
}

export async function waitForGenerationFinish(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  const maxExtensionMs = Math.min(30000, Math.max(5000, Math.floor(timeoutMs * 0.25)));

  while (Date.now() - start < timeoutMs + maxExtensionMs) {
    const error = detectGeminiError();
    if (error) {
      throw new Error(error);
    }

    if (!isBusyProcessing() && isSendReady()) {
      return true;
    }

    await wait(200);
  }

  return false;
}

export async function waitForStableResponseAfterCompletion({
  stableSeconds,
  timeoutMs,
}: {
  stableSeconds: number;
  timeoutMs: number;
  baselineResponseText?: string;
  baselineSignature?: string;
}): Promise<string> {
  const response = await waitForResponseCaptureAfterSendReady(Math.max(1000, Math.min(timeoutMs, stableSeconds * 1000 + 1000)));

  if (response.length > 0) {
    return response;
  }

  if (isBusyProcessing() || !isSendReady()) {
    throw new Error(
      `GENERATION_NOT_FINISHED|responseLength=${response.length}|sendReady=${String(isSendReady())}|busyProcessing=${String(isBusyProcessing())}`,
    );
  }

  throw new Error(
    `EMPTY_RESPONSE_AFTER_GENERATION|responseLength=${response.length}|sendReady=${String(isSendReady())}|busyProcessing=${String(isBusyProcessing())}`,
  );
}
