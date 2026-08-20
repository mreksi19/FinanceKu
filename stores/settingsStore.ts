import { create } from 'zustand';
import type { SQLiteDatabase } from '@/services/database';

interface SettingsState {
  displayName: string;
  currency: string;
  loading: boolean;
  loadSettings: (db: SQLiteDatabase) => Promise<void>;
  saveSettings: (db: SQLiteDatabase, displayName: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  displayName: 'Saya',
  currency: 'IDR',
  loading: false,

  loadSettings: async (db) => {
    set({ loading: true });
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings'
    );
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    set({
      displayName: map.display_name ?? 'Saya',
      currency: map.currency ?? 'IDR',
      loading: false,
    });
  },

  saveSettings: async (db, displayName) => {
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      'display_name',
      displayName
    );
    set({ displayName });
  },
}));
