import { create } from 'zustand';
import type { SQLiteDatabase } from '@/services/database';
import type { Allocation } from '@/types/finance';

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface AllocationState {
  allocations: Allocation[];
  loading: boolean;
  fetchAllocations: (db: SQLiteDatabase, period?: string) => Promise<void>;
  addAllocation: (
    db: SQLiteDatabase,
    data: { name: string; icon: string; color: string }
  ) => Promise<void>;
  allocateFunds: (db: SQLiteDatabase, allocationId: number, amount: number) => Promise<void>;
  spendFromAllocation: (
    db: SQLiteDatabase,
    allocationId: number,
    amount: number,
    note: string
  ) => Promise<void>;
  deleteAllocation: (db: SQLiteDatabase, id: number) => Promise<void>;
}

export const useAllocationStore = create<AllocationState>((set, get) => ({
  allocations: [],
  loading: false,

  fetchAllocations: async (db, period = currentPeriod()) => {
    set({ loading: true });
    const rows = await db.getAllAsync<Allocation>(
      'SELECT * FROM allocations WHERE period = ? ORDER BY created_at DESC',
      [period]
    );
    set({ allocations: rows, loading: false });
  },

  addAllocation: async (db, { name, icon, color }) => {
    await db.runAsync(
      `INSERT INTO allocations (name, icon, color, budget_amount, spent_amount, period)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [name, icon, color, currentPeriod()]
    );
    await get().fetchAllocations(db);
  },

  allocateFunds: async (db, allocationId, amount) => {
    await db.runAsync(
      `UPDATE allocations SET budget_amount = budget_amount + ?, updated_at = datetime('now','localtime') WHERE id = ?`,
      [amount, allocationId]
    );
    await db.runAsync(
      `INSERT INTO transactions (type, amount, note, allocation_id) VALUES ('allocation', ?, 'Alokasi dana', ?)`,
      [amount, allocationId]
    );
    await get().fetchAllocations(db);
  },

  spendFromAllocation: async (db, allocationId, amount, note) => {
    await db.runAsync(
      `UPDATE allocations SET spent_amount = spent_amount + ?, updated_at = datetime('now','localtime') WHERE id = ?`,
      [amount, allocationId]
    );
    await db.runAsync(
      `INSERT INTO transactions (type, amount, note, allocation_id) VALUES ('expense', ?, ?, ?)`,
      [amount, note, allocationId]
    );
    await get().fetchAllocations(db);
  },

  deleteAllocation: async (db, id) => {
    await db.runAsync('DELETE FROM allocations WHERE id = ?', [id]);
    await get().fetchAllocations(db);
  },
}));
