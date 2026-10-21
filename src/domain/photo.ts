/** Côté maximal (en pixels) d'une photo enregistrée. */
export const PHOTO_MAX_SIDE = 1024;
export const PHOTO_QUALITY = 0.7;

/** Dimensions réduites pour tenir dans un carré de `max` pixels, proportions conservées (jamais agrandies). */
export function fitWithin(width: number, height: number, max: number = PHOTO_MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      // Applique l'orientation EXIF (photos de téléphone prises en portrait).
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Repli sur <img> ci-dessous.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Réduit et compresse une photo en JPEG (data-URL). Le passage par un canvas supprime les métadonnées
 * EXIF (dont la position GPS).
 */
export async function compressPhoto(file: Blob): Promise<string> {
  const image = await decode(file);
  try {
    const { width, height } = fitWithin(image.width, image.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image.source, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', PHOTO_QUALITY);
  } finally {
    image.close();
  }
}
