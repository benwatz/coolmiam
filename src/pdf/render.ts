import { jsPDF } from 'jspdf';
import { hexToRgb, textColorFor } from '../domain/contrast';
import { capitalize, dateRange, formatLongDate, formatShortDate } from '../domain/dates';
import { EXTRA_COLOR, MEAL_TYPE_LABELS, type Meal, type TypeColors } from '../domain/types';
import { registerFonts, PDF_FONT } from './fonts';
import {
  CONTENT_WIDTH,
  PAGE,
  SIZES,
  groupByDay,
  layoutJournal,
  type MealMeasure,
  type PlacedItem,
} from './layout';

export const PDF_TITLE = 'Journal alimentaire';

const FONT_SIZE = {
  title: 18,
  subtitle: 11,
  meta: 10,
  dayTitle: 13,
  firstLine: 11,
  body: 10,
  footer: 9,
} as const;

/** Épaisseur du contour "Extra", en millimètres. */
const EXTRA_BORDER = 0.8;
const TEXT_WIDTH = CONTENT_WIDTH - 2 * SIZES.blockPadding;

export interface PdfOptions {
  start: string;
  end: string;
  meals: Meal[];
  colors: TypeColors;
}

function setColor(doc: jsPDF, kind: 'text' | 'fill' | 'draw', hex: string) {
  const [r, g, b] = hexToRgb(hex);
  if (kind === 'text') doc.setTextColor(r, g, b);
  else if (kind === 'fill') doc.setFillColor(r, g, b);
  else doc.setDrawColor(r, g, b);
}

function measureMeal(doc: jsPDF, meal: Meal): MealMeasure {
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(FONT_SIZE.body);
  const descLines = doc.splitTextToSize(meal.description, TEXT_WIDTH) as string[];
  let noteLines: string[] = [];
  if (meal.notes.trim()) {
    doc.setFont(PDF_FONT, 'italic');
    noteLines = doc.splitTextToSize(`Notes : ${meal.notes}`, TEXT_WIDTH) as string[];
  }
  return { descLines, noteLines };
}

function drawItem(doc: jsPDF, item: PlacedItem, opts: PdfOptions) {
  const x = PAGE.margin;
  switch (item.kind) {
    case 'header': {
      setColor(doc, 'text', '#000000');
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(FONT_SIZE.title);
      doc.text(PDF_TITLE, x, item.y, { baseline: 'top' });
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(FONT_SIZE.subtitle);
      doc.text(
        `Période : du ${formatShortDate(opts.start)} au ${formatShortDate(opts.end)}`,
        x,
        item.y + 9,
        { baseline: 'top' },
      );
      const extraCount = opts.meals.filter((m) => m.extra && m.date >= opts.start && m.date <= opts.end).length;
      doc.setFont(PDF_FONT, 'bold');
      doc.text(`Total extra(s) : ${extraCount}`, x, item.y + 15, { baseline: 'top' });
      doc.setFont(PDF_FONT, 'normal');
      setColor(doc, 'draw', '#999999');
      doc.setLineWidth(0.3);
      doc.line(x, item.y + 21, x + CONTENT_WIDTH, item.y + 21);
      break;
    }
    case 'dayTitle': {
      setColor(doc, 'text', '#000000');
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(FONT_SIZE.dayTitle);
      doc.text(capitalize(formatLongDate(item.date)), x, item.y + 1, { baseline: 'top' });
      break;
    }
    case 'empty': {
      setColor(doc, 'text', '#444444');
      doc.setFont(PDF_FONT, 'italic');
      doc.setFontSize(FONT_SIZE.body);
      doc.text('Aucun repas saisi', x, item.y + 0.5, { baseline: 'top' });
      break;
    }
    case 'meal': {
      const { meal, measure } = item;
      const background = opts.colors[meal.type];
      const textColor = textColorFor(background);
      setColor(doc, 'fill', background);
      if (meal.extra) {
        setColor(doc, 'draw', EXTRA_COLOR);
        doc.setLineWidth(EXTRA_BORDER);
        // Le contour est tracé à l'intérieur du bloc pour ne pas dépasser les marges.
        const inset = EXTRA_BORDER / 2;
        doc.roundedRect(x + inset, item.y + inset, CONTENT_WIDTH - EXTRA_BORDER, item.height - EXTRA_BORDER, 1.5, 1.5, 'FD');
      } else {
        doc.roundedRect(x, item.y, CONTENT_WIDTH, item.height, 1.5, 1.5, 'F');
      }

      const tx = x + SIZES.blockPadding;
      let ty = item.y + SIZES.blockPadding;
      setColor(doc, 'text', textColor);
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(FONT_SIZE.firstLine);
      doc.text(`${meal.time} - ${MEAL_TYPE_LABELS[meal.type]}`, tx, ty, { baseline: 'top' });
      if (meal.extra) {
        doc.text('EXTRA', x + CONTENT_WIDTH - SIZES.blockPadding, ty, { baseline: 'top', align: 'right' });
      }
      ty += SIZES.firstLineHeight + SIZES.innerGap;

      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(FONT_SIZE.body);
      for (const line of measure.descLines) {
        doc.text(line, tx, ty, { baseline: 'top' });
        ty += SIZES.bodyLineHeight;
      }
      if (measure.noteLines.length > 0) {
        ty += SIZES.innerGap;
        doc.setFont(PDF_FONT, 'italic');
        for (const line of measure.noteLines) {
          doc.text(line, tx, ty, { baseline: 'top' });
          ty += SIZES.bodyLineHeight;
        }
      }
      break;
    }
  }
}

/** Génère le PDF A4 du journal sur la période [start, end] (bornes incluses). */
export async function generateJournalPdf(opts: PdfOptions): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  await registerFonts(doc);
  doc.setProperties({ title: PDF_TITLE, subject: PDF_TITLE, creator: '' });
  doc.setLanguage('fr');

  const days = groupByDay(dateRange(opts.start, opts.end), opts.meals);
  const pages = layoutJournal(days, (meal) => measureMeal(doc, meal));

  pages.forEach((items, index) => {
    if (index > 0) doc.addPage('a4', 'portrait');
    for (const item of items) drawItem(doc, item, opts);
  });

  const total = pages.length;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    setColor(doc, 'text', '#444444');
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(FONT_SIZE.footer);
    doc.text(`Page ${i}/${total}`, PAGE.width / 2, PAGE.height - PAGE.margin, {
      align: 'center',
      baseline: 'bottom',
    });
  }

  return doc.output('blob');
}
