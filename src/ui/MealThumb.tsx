import { useEffect, useState } from 'preact/hooks';
import { useRepo } from '../auth/session';

/** Miniature de la photo d'un repas, chargée à la demande (les listes de repas ne contiennent pas les images). */
export function MealThumb({ mealId }: { mealId: string }) {
  const repo = useRepo();
  const [src, setSrc] = useState<string | undefined>();
  useEffect(() => {
    let active = true;
    repo
      .getPhoto(mealId)
      .then((photo) => active && setSrc(photo))
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [repo, mealId]);
  return src ? <img class="meal-card__photo" src={src} alt="Photo du repas" /> : <span class="meal-card__photo" />;
}
