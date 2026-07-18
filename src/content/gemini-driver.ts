import {
  clearEditor,
  clickSend,
  focusEditor,
  insertText,
  verifyInsertedContent,
  waitForEditorReady,
  waitForGenerationStart,
  waitForSendReady,
} from './gemini-dom';

export interface SubmitScriptOnceOptions {
  prompt: string;
}

export interface SubmitScriptOnceResult {
  submitted: boolean;
  startedAt: string;
  buttonTransitionSeen: boolean;
}

export async function submitScriptOnce({ prompt }: SubmitScriptOnceOptions): Promise<SubmitScriptOnceResult> {
  const editor = await waitForEditorReady(15000);
  focusEditor(editor);
  clearEditor(editor);
  insertText(editor, prompt);

  if (!verifyInsertedContent(editor, prompt)) {
    throw new Error('VERIFY_INSERT_FAILED');
  }

  let sendButton = await waitForSendReady(10000);
  clickSend(sendButton);

  let buttonTransitionSeen: boolean;
  try {
    buttonTransitionSeen = await waitForGenerationStart(15000);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GENERATION_NOT_STARTED';
    if (!message.startsWith('GENERATION_NOT_STARTED')) {
      throw error;
    }

    await waitForEditorReady(3000);
    sendButton = await waitForSendReady(5000);
    clickSend(sendButton);
    buttonTransitionSeen = await waitForGenerationStart(10000);
  }

  return {
    submitted: true,
    startedAt: new Date().toISOString(),
    buttonTransitionSeen,
  };
}
