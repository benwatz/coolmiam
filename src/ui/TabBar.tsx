import type { ComponentType } from 'preact';
import { IconExport, IconJournal, IconSettings } from './icons';

export type Tab = 'journal' | 'export' | 'settings';

const TABS: { id: Tab; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'journal', label: 'Journal', Icon: IconJournal },
  { id: 'export', label: 'Export', Icon: IconExport },
  { id: 'settings', label: 'Réglages', Icon: IconSettings },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav class="tabbar" aria-label="Navigation principale">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          class={`tabbar__item${active === id ? ' tabbar__item--active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
