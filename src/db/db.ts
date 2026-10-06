import Dexie, { type EntityTable } from 'dexie';
import type { Meal } from '../domain/types';

export interface SettingRow {
  key: string;
  value: unknown;
}

export class CoolmiamDb extends Dexie {
  meals!: EntityTable<Meal, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;

  constructor(name = 'coolmiam') {
    super(name);
    this.version(1).stores({
      meals: 'id, date, [date+time]',
      settings: 'key',
    });
  }
}

export const db = new CoolmiamDb();
