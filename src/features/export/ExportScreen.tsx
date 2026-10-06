import { useEffect, useRef, useState } from 'preact/hooks';
import { repo } from '../../db';
import { useLiveQuery } from '../../db/useLiveQuery';
import { addDays, formatShortDate, isValidDateStr, todayStr } from '../../domain/dates';
import { exportFileName } from '../../domain/meals';
import type { TypeColors } from '../../domain/types';
import { canShareFile, shareFile } from './share';

interface Props {
  colors: TypeColors;
}

interface Generated {
  file: File;
  url: string;
  canShare: boolean;
}

export function ExportScreen({ colors }: Props) {
  const [start, setStart] = useState(() => addDays(todayStr(), -6));
  const [end, setEnd] = useState(() => todayStr());
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const datesValid = isValidDateStr(start) && isValidDateStr(end);
  const rangeError = !datesValid
    ? 'Veuillez saisir des dates valides.'
    : end < start
      ? 'La date de fin doit être postérieure ou égale à la date de début.'
      : null;

  const count = useLiveQuery(
    () => (rangeError ? Promise.resolve(0) : repo.countMealsInRange(start, end)),
    [start, end, rangeError],
  );

  // URL d'objet du PDF courant, libérée dès qu'elle est remplacée ou à la sortie de l'écran.
  const urlRef = useRef<string | null>(null);
  const replaceGenerated = (next: Generated | null) => {
    if (urlRef.current && urlRef.current !== next?.url) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next?.url ?? null;
    setGenerated(next);
  };
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  // Toute modification de la période invalide le PDF déjà généré.
  useEffect(() => {
    replaceGenerated(null);
    setMessage(null);
  }, [start, end]);

  const generate = async () => {
    if (rangeError || !count) return;
    setGenerating(true);
    setMessage(null);
    try {
      // Import différé : jsPDF n'est chargé qu'au moment de l'export.
      const { generateJournalPdf, PDF_TITLE } = await import('../../pdf/render');
      const meals = await repo.getMealsInRange(start, end);
      const blob = await generateJournalPdf({ start, end, meals, colors });
      const file = new File([blob], exportFileName(start, end), { type: 'application/pdf' });
      const shareOk = canShareFile(file);
      replaceGenerated({ file, url: URL.createObjectURL(file), canShare: shareOk });
      if (!shareOk) {
        setMessage(
          `Le partage direct n'est pas disponible sur cet appareil. Utilisez "Enregistrer / ouvrir" pour récupérer le PDF (${PDF_TITLE}).`,
        );
      }
    } catch (err) {
      console.error(err);
      setMessage('La génération du PDF a échoué. Veuillez réessayer.');
    } finally {
      setGenerating(false);
    }
  };

  const share = async () => {
    if (!generated) return;
    const result = await shareFile(generated.file, 'Journal alimentaire');
    if (result === 'unsupported') {
      replaceGenerated({ ...generated, canShare: false });
      setMessage(`Le partage direct n'est pas disponible sur cet appareil. Utilisez "Enregistrer / ouvrir".`);
    } else if (result === 'error') {
      setMessage(`Le partage a échoué. Vous pouvez utiliser "Enregistrer / ouvrir".`);
    }
  };

  return (
    <section class="screen" aria-labelledby="export-title">
      <div class="screen__scroll">
        <h2 id="export-title" class="screen__title">
          Export PDF
        </h2>
        <div class="field-row">
          <div class="field">
            <label for="export-start">Date de début</label>
            <input
              id="export-start"
              type="date"
              value={start}
              onInput={(e) => setStart(e.currentTarget.value)}
              aria-invalid={rangeError ? true : undefined}
            />
          </div>
          <div class="field">
            <label for="export-end">Date de fin</label>
            <input
              id="export-end"
              type="date"
              value={end}
              onInput={(e) => setEnd(e.currentTarget.value)}
              aria-invalid={rangeError ? true : undefined}
              aria-describedby={rangeError ? 'export-range-error' : undefined}
            />
          </div>
        </div>

        {rangeError ? (
          <p class="field__error" id="export-range-error" role="alert">
            {rangeError}
          </p>
        ) : (
          <p class="export-count" data-testid="export-count" aria-live="polite">
            {count === undefined
              ? 'Calcul en cours...'
              : count === 0
                ? `Aucun repas saisi du ${formatShortDate(start)} au ${formatShortDate(end)} : aucun PDF à générer.`
                : `${count} repas du ${formatShortDate(start)} au ${formatShortDate(end)}.`}
          </p>
        )}

        <button
          type="button"
          class="btn btn--primary btn--block"
          disabled={Boolean(rangeError) || !count || generating}
          onClick={generate}
        >
          {generating ? 'Génération en cours...' : 'Générer le PDF'}
        </button>

        {generated && (
          <div class="export-result" role="status">
            <p>
              PDF prêt : <strong>{generated.file.name}</strong>
            </p>
            <div class="export-result__actions">
              {generated.canShare && (
                <button type="button" class="btn btn--primary" onClick={share}>
                  Partager
                </button>
              )}
              <a class="btn" href={generated.url} download={generated.file.name} target="_blank" rel="noopener">
                Enregistrer / ouvrir
              </a>
            </div>
          </div>
        )}

        {message && (
          <p class="notice" role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
