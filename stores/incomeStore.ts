import { create } from 'zustand';
import type { SQLiteDatabase } from '@/services/database';
import type { IncomeSource } from '@/types/finance';

interface IncomeState {
  sources: IncomeSource[];
  loading: boolean;
  fetchSources: (db: SQLiteDatabase) => Promise<void>;
  addSource: (
    db: SQLiteDatabase,
    data: { name: string; icon: string; color: string; amount: number; accountId?: number | null }
  ) => Promise<void>;
  topUpSource: (
    db: SQLiteDatabase,
    id: number,
    amount: number,
    note?: string,
    accountId?: number | null
  ) => Promise<void>;
  deleteSource: (db: SQLiteDatabase, id: number) => Promise<void>;
}

export const useIncomeStore = create<IncomeState>((set, get) => ({
  sources: [],
  loading: false,

  fetchSources: async (db) => {
    set({ loading: true });
    const rows = await db.getAllAsync<IncomeSource>(
      'SELECT * FROM income_sources ORDER BY created_at DESC'
    );
    set({ sources: rows, loading: false });
  },

  addSource: async (db, { name, icon, color, amount, accountId = null }) => {
    await db.runAsync(
      `INSERT INTO income_sources (name, icon, color, initial_amount, current_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [name, icon, color, amount, amount]
    );
    const sourceId = (
      await db.getFirstAsync<{ id: number }>('SELECT last_insert_rowid() as id')
    )?.id;
    if (sourceId) {
      await db.runAsync(
        `INSERT INTO transactions (type, amount, note, income_source_id, account_id, tx_date)
         VALUES ('income', ?, ?, ?, ?, datetime('now','localtime'))`,
        [amount, `Pemasukan awal: ${name}`, sourceId, accountId]
      );
      if (accountId) {
        await db.runAsync(
          `UPDATE accounts SET balance = balance + ?, updated_at = datetime('now','localtime') WHERE id = ?`,
          [amount, accountId]
        );
      }
    }
    await get().fetchSources(db);
  },

  topUpSource: async (db, id, amount, note, accountId = null) => {
    await db.runAsync(
      `UPDATE income_sources SET current_amount = current_amount + ?, updated_at = datetime('now','localtime') WHERE id = ?`,
      [amount, id]
    );
    await db.runAsync(
      `INSERT INTO transactions (type, amount, note, income_source_id, account_id, tx_date)
       VALUES ('income', ?, ?, ?, ?, datetime('now','localtime'))`,
      [amount, note ?? 'Tambah pemasukan', id, accountId]
    );
    if (accountId) {
      await db.runAsync(
        `UPDATE accounts SET balance = balance + ?, updated_at = datetime('now','localtime') WHERE id = ?`,
        [amount, accountId]
      );
    }
    await get().fetchSources(db);
  },

  deleteSource: async (db, id) => {
    await db.runAsync('DELETE FROM income_sources WHERE id = ?', [id]);
    await get().fetchSources(db);
  },
}));
