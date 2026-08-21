import { useCallback, useEffect, useState } from 'react';
import type { RunCalendarEntry } from '../../core/models';
import { runCalendarRepository } from '../../storage/repositories';

export function useRunCalendar() {
  const [entries, setEntries] = useState<RunCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>('');

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
    setMessage('Calendar entry deleted.');
    await loadEntries();
  }, [loadEntries]);

  const recoverEntry = useCallback(async (runId: string) => {
    const result = await runCalendarRepository.recoverToResults(runId);
    if (result === 'restored') {
      setMessage('Recovered this run back to Results. Outputs/stage details are restored only if they still exist in storage.');
    } else if (result === 'already-exists') {
      setMessage('This run already exists in Results.');
    } else {
      setMessage('Could not find this calendar snapshot to recover.');
    }
    await loadEntries();
  }, [loadEntries]);

  return {
    entries,
    loading,
    message,
    reload: loadEntries,
    deleteEntry,
    recoverEntry,
  };
}
