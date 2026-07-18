import { captureAllResponses, captureLatestResponse, detectGeminiError, extractJapaneseScriptBlocks, getGemName, isBusyProcessing, isGenerating, isSendReady, waitForEditorReady } from './gemini-dom';
import { submitScriptOnce } from './gemini-driver';
import {
  runtimeMessageTypes,
  type CollectJapaneseScriptsData,
  type CollectJapaneseScriptsPayload,
  type MessageEnvelope,
  type PageStateData,
  type SubmitScriptData,
  type SubmitScriptPayload,
  type VerifyGemData,
} from '../shared/messaging/contracts';

console.info('Gem Auto Flow content script loaded.');

function successEnvelope<T>(correlationId: string, data: T, message = 'OK'): MessageEnvelope<T> {
  return {
    success: true,
    data,
    errorCode: null,
    message,
    correlationId,
  };
}

function errorEnvelope(correlationId: string, errorCode: string, message: string): MessageEnvelope<null> {
  return {
    success: false,
    data: null,
    errorCode,
    message,
    correlationId,
  };
}

function mergeUniqueBlocks(blocks: string[]): string[] {
  const uniqueBlocks: string[] = [];
  for (const block of blocks) {
    const normalized = block.trim();
    if (!normalized) {
      continue;
    }
    if (!uniqueBlocks.some((item) => item === normalized)) {
      uniqueBlocks.push(normalized);
    }
  }
  return uniqueBlocks;
}

chrome.runtime.onMessage.addListener((message: { type?: string; correlationId?: string; expectedGemName?: string } & Partial<SubmitScriptPayload & CollectJapaneseScriptsPayload>, _sender, sendResponse) => {
  const correlationId = message.correlationId ?? 'no-correlation-id';

  if (message.type === runtimeMessageTypes.pingContent) {
    sendResponse({
      ok: true,
      url: window.location.href,
      title: document.title,
    });
    return false;
  }

  if (message.type === runtimeMessageTypes.pingPage) {
    void (async () => {
      try {
        await waitForEditorReady(10000);
        const data: PageStateData = {
          url: window.location.href,
          title: document.title,
          ready: true,
          gemName: getGemName(),
          sendReady: isSendReady(),
          generating: isGenerating(),
          busyProcessing: isBusyProcessing(),
          latestResponseText: captureLatestResponse(),
          responseLength: captureLatestResponse().length,
        } as PageStateData & { sendReady: boolean; generating: boolean; busyProcessing: boolean; latestResponseText: string; responseLength: number };
        sendResponse(successEnvelope(correlationId, data));
      } catch (error) {
        sendResponse(errorEnvelope(correlationId, 'PAGE_NOT_READY', error instanceof Error ? error.message : 'Page not ready'));
      }
    })();
    return true;
  }

  if (message.type === runtimeMessageTypes.verifyGem) {
    const actualGemName = getGemName();
    const expectedGemName = message.expectedGemName ?? '';
    const data: VerifyGemData = {
      actualGemName,
      expectedGemName,
      matches: !expectedGemName.trim() || actualGemName.toLowerCase().includes(expectedGemName.toLowerCase()),
    };
    sendResponse(data.matches
      ? successEnvelope(correlationId, data)
      : errorEnvelope(correlationId, 'WRONG_GEM', `Expected gem "${expectedGemName}" but found "${actualGemName}".`));
    return false;
  }

  if (message.type === runtimeMessageTypes.getPageState) {
    const errorCode = detectGeminiError();
    const latestResponseText = captureLatestResponse();
    const data: PageStateData = {
      url: window.location.href,
      title: document.title,
      ready: Boolean(document.body),
      gemName: getGemName(),
      sendReady: isSendReady(),
      generating: isGenerating(),
      busyProcessing: isBusyProcessing(),
      latestResponseText,
      responseLength: latestResponseText.length,
    } as PageStateData & { sendReady: boolean; generating: boolean; busyProcessing: boolean; latestResponseText: string; responseLength: number };
    sendResponse(errorCode ? errorEnvelope(correlationId, errorCode, errorCode) : successEnvelope(correlationId, data));
    return false;
  }

  if (message.type === runtimeMessageTypes.submitScript) {
    void (async () => {
      try {
        const result = await submitScriptOnce({
          prompt: message.prompt ?? '',
        });

        const data: SubmitScriptData = {
          submitted: result.submitted,
          startedAt: result.startedAt,
          url: window.location.href,
          title: document.title,
          buttonTransitionSeen: result.buttonTransitionSeen,
        };
        sendResponse(successEnvelope(correlationId, data));
      } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Unknown submit error';
        sendResponse(errorEnvelope(correlationId, messageText, messageText));
      }
    })();
    return true;
  }

  if (message.type === runtimeMessageTypes.collectJapaneseScripts) {
    try {
      const rawResponseText = captureAllResponses();
      const extractedScripts = mergeUniqueBlocks(extractJapaneseScriptBlocks(rawResponseText));
      const data: CollectJapaneseScriptsData = {
        currentTabUrl: window.location.href,
        rawResponseText,
        extractedScripts,
        combinedOutput: extractedScripts.join('\n\n'),
        collectedAt: new Date().toISOString(),
      };
      sendResponse(successEnvelope(correlationId, data));
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to collect scripts';
      sendResponse(errorEnvelope(correlationId, messageText, messageText));
    }
    return false;
  }

  if (message.type === runtimeMessageTypes.cancelWait) {
    sendResponse(successEnvelope(correlationId, null, 'Cancel wait acknowledged.'));
    return false;
  }

  return false;
});
