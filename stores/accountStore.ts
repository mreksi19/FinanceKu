import { create } from 'zustand';
import type { SQLiteDatabase } from '@/services/database';
import type { Account } from '@/types/finance';

interface AccountState {
  accounts: Account[];
  loading: boolean;
  fetchAccounts: (db: SQLiteDatabase) => Promise<void>;
  addAccount: (
    db: SQLiteDatabase,
    data: { name: string; icon: string; color: string; balance: number }
  ) => Promise<void>;
  adjustBalance: (db: SQLiteDatabase, id: number, delta: number) => Promise<void>;
  deleteAccount: (db: SQLiteDatabase, id: number) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  loading: false,

  fetchAccounts: async (db) => {
    set({ loading: true });
    const rows = await db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY created_at ASC');
    set({ accounts: rows, loading: false });
  },

  addAccount: async (db, { name, icon, color, balance }) => {
    await db.runAsync(
      `INSERT INTO accounts (name, icon, color, balance) VALUES (?, ?, ?, ?)`,
      [name, icon, color, balance]
    );
    await get().fetchAccounts(db);
  },

  adjustBalance: async (db, id, delta) => {
    await db.runAsync(
      `UPDATE accounts SET balance = balance + ?, updated_at = datetime('now','localtime') WHERE id = ?`,
      [delta, id]
    );
    await get().fetchAccounts(db);
  },

  deleteAccount: async (db, id) => {
    await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
    await get().fetchAccounts(db);
  },
}));
