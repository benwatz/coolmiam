import { useEffect, useState } from 'preact/hooks';
import type { Unsubscribe } from '../backend/types';

/** S'abonne à une source de données (`repo.watch…`) et se met à jour à chaque nouvelle valeur. */
export function useLiveQuery<T>(subscribe: (callback: (value: T) => void) => Unsubscribe, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => subscribe((next) => setValue(() => next)), deps);
  return value;
}
