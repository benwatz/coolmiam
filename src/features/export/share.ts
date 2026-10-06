/** Partage via la Web Share API, avec détection de la prise en charge des fichiers. */

export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error';

export async function shareFile(file: File, title: string): Promise<ShareResult> {
  if (!canShareFile(file)) return 'unsupported';
  try {
    await navigator.share({ files: [file], title });
    return 'shared';
  } catch (err) {
    // Annulation par l'utilisateur : aucune erreur à afficher.
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    console.error(err);
    return 'error';
  }
}
