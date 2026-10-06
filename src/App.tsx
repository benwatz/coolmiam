import { useState } from 'preact/hooks';
import { useRepo } from './auth/session';
import { useLiveQuery } from './db/useLiveQuery';
import { nowTimeStr, todayStr } from './domain/dates';
import { suggestMealType } from './domain/meals';
import { DEFAULT_TYPE_COLORS, type Meal, type MealInput } from './domain/types';
import { ExportScreen } from './features/export/ExportScreen';
import { JournalScreen } from './features/journal/JournalScreen';
import { MealForm } from './features/meal-form/MealForm';
import { clearDraft, loadDraft, type FormDraft } from './features/meal-form/draft';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { TabBar, type Tab } from './ui/TabBar';

function newMealValues(date: string): MealInput {
  const time = nowTimeStr();
  return { date, time, type: suggestMealType(time), description: '', notes: '', extra: false };
}

export function App() {
  // Un brouillon restant (application fermée en arrière-plan) rouvre le formulaire tel quel.
  const [form, setForm] = useState<FormDraft | null>(() => loadDraft());
  const [tab, setTab] = useState<Tab>('journal');
  const [date, setDate] = useState<string>(() => form?.values.date ?? todayStr());
  const repo = useRepo();
  const colors = useLiveQuery(repo.watchTypeColors, [repo]) ?? DEFAULT_TYPE_COLORS;

  const closeForm = () => {
    clearDraft();
    setForm(null);
  };

  const openEdit = (meal: Meal) => {
    const { date: d, time, type, description, notes, extra } = meal;
    setForm({ mealId: meal.id, values: { date: d, time, type, description, notes, extra } });
  };

  return (
    <div class="app">
      <header class="app-header">
        <div class="app-header__brand">
          <img
            class="app-header__logo"
            src={`${import.meta.env.BASE_URL}coolmiam-mark.svg`}
            alt=""
            width="30"
            height="30"
          />
          <h1>Coolmiam</h1>
        </div>
      </header>
      <main class="app-main">
        {form ? (
          <MealForm
            key={form.mealId ?? 'new'}
            mealId={form.mealId}
            initialValues={form.values}
            colors={colors}
            onSaved={(savedDate) => {
              closeForm();
              setDate(savedDate);
              setTab('journal');
            }}
            onCancel={closeForm}
            onDeleted={closeForm}
          />
        ) : tab === 'journal' ? (
          <JournalScreen
            date={date}
            colors={colors}
            onDateChange={setDate}
            onAdd={() => setForm({ mealId: null, values: newMealValues(date) })}
            onEdit={openEdit}
          />
        ) : tab === 'export' ? (
          <ExportScreen colors={colors} />
        ) : (
          <SettingsScreen colors={colors} />
        )}
      </main>
      {!form && <TabBar active={tab} onChange={setTab} />}
    </div>
  );
}
