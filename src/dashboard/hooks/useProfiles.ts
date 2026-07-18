import { useCallback, useEffect, useMemo, useState } from 'react';
import { cloneProfile, createDefaultProfile } from '../../core/factories';
import type { GemProfile } from '../../core/models';
import { validateProfile } from '../../core/validation';
import { profileRepository } from '../../storage/repositories';
import { nowIso } from '../../shared/utils/time';

export interface SaveProfileResult {
  ok: boolean;
  message?: string;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<GemProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const loadProfiles = useCallback(async () => {
    const data = await profileRepository.getAll();
    if (data.length === 0) {
      const defaultProfile = createDefaultProfile();
      await profileRepository.save(defaultProfile);
      setProfiles([defaultProfile]);
      setSelectedProfileId(defaultProfile.id);
      setLoading(false);
      return;
    }

    setProfiles(data);
    setSelectedProfileId((current) => current ?? data[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadProfiles();
    };

    void load();
  }, [loadProfiles]);

  const updateSelectedProfile = useCallback((updater: (profile: GemProfile) => GemProfile) => {
    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === selectedProfileId
          ? updater({ ...profile, updatedAt: nowIso() })
          : profile,
      ),
    );
  }, [selectedProfileId]);

  const createProfile = useCallback(() => {
    const newProfile = createDefaultProfile();
    setProfiles((current) => [newProfile, ...current]);
    setSelectedProfileId(newProfile.id);
  }, []);

  const duplicateProfile = useCallback(() => {
    if (!selectedProfile) {
      return;
    }

    const duplicate = cloneProfile(selectedProfile);
    setProfiles((current) => [duplicate, ...current]);
    setSelectedProfileId(duplicate.id);
  }, [selectedProfile]);

  const deleteProfile = useCallback(() => {
    if (!selectedProfileId) {
      return;
    }

    setProfiles((current) => {
      const remaining = current.filter((profile) => profile.id !== selectedProfileId);
      setSelectedProfileId(remaining[0]?.id ?? null);
      return remaining.length > 0 ? remaining : [createDefaultProfile()];
    });
  }, [selectedProfileId]);

  const saveProfiles = useCallback(async () => {
    for (const profile of profiles) {
      await profileRepository.save(profile);
    }

    const persisted = await profileRepository.getAll();
    const removedIds = persisted
      .filter((stored) => !profiles.some((profile) => profile.id === stored.id))
      .map((profile) => profile.id);

    await Promise.all(removedIds.map((id) => profileRepository.delete(id)));
  }, [profiles]);

  const persistSelectedProfile = useCallback(async (): Promise<SaveProfileResult> => {
    if (!selectedProfile) {
      return { ok: false, message: 'No profile selected.' };
    }

    const validation = validateProfile(selectedProfile);
    if (!validation.isValid) {
      return { ok: false, message: 'Please fix validation errors before saving.' };
    }

    await saveProfiles();
    return { ok: true };
  }, [saveProfiles, selectedProfile]);

  return {
    profiles,
    selectedProfile,
    selectedProfileId,
    loading,
    setSelectedProfileId,
    updateSelectedProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
    persistSelectedProfile,
  };
}
