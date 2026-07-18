import { useCallback, useEffect, useState } from 'react';
import type { RunCalendarEntry } from '../../core/models';
import { runCalendarRepository } from '../../storage/repositories';

export function useRunCalendar() {
  const [entries, setEntries] = useState<RunCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    const nextEntries = await runCalendarRepository.getAll();
    setEntries(nextEntries);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const deleteEntry = useCallback(async (runId: string) => {
    await runCalendarRepository.delete(runId);
    await loadEntries();
  }, [loadEntries]);

  return {
    entries,
    loading,
    reload: loadEntries,
    deleteEntry,
  };
}
