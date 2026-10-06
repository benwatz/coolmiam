import { liveQuery } from 'dexie';
import { useEffect, useState } from 'preact/hooks';

/** Équivalent minimal de dexie-react-hooks pour Preact : se met à jour à chaque écriture. */
export function useLiveQuery<T>(query: () => Promise<T>, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (result) => setValue(() => result),
      error: (err) => console.error(err),
    });
    return () => subscription.unsubscribe();
  }, deps);
  return value;
}
