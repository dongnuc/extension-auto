import type { GemProfile } from '../../core/models';
import type { validateProfile } from '../../core/validation';

export type ProfileValidationState = ReturnType<typeof validateProfile>;
export type ProfileEditorProfile = GemProfile;
