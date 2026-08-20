import { create } from 'zustand';
import type { SQLiteDatabase } from '@/services/database';
import type { Transaction } from '@/types/finance';

export interface TransactionWithLabel extends Transaction {
  income_source_name?: string | null;
  allocation_name?: string | null;
  allocation_color?: string | null;
  allocation_icon?: string | null;
  account_name?: string | null;
}

export interface Summary {
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  totalBalance: number;
  unallocated: number;
}

export interface MonthSummary {
  period: string; // YYYY-MM
  income: number;
  expense: number;
  total: number;
}

export interface DayPoint {
  date: string; // YYYY-MM-DD
  total: number;
}

interface TransactionState {
  transactions: TransactionWithLabel[];
  summary: Summary;
  monthSummaries: MonthSummary[];
  last7Days: DayPoint[];
  balanceTrend: { period: string; balance: number }[];
  loading: boolean;
  fetchTransactions: (db: SQLiteDatabase, limit?: number) => Promise<void>;
  fetchSummary: (db: SQLiteDatabase) => Promise<void>;
  fetchMonthSummaries: (db: SQLiteDatabase, months?: number) => Promise<void>;
  fetchLast7Days: (db: SQLiteDatabase) => Promise<void>;
  fetchBalanceTrend: (db: SQLiteDatabase, months?: number) => Promise<void>;
  addExpense: (
    db: SQLiteDatabase,
    data: {
      amount: number;
      note: string;
      payee?: string;
      allocationId?: number | null;
      accountId?: number | null;
      txDate?: string;
      isCleared?: boolean;
    }
  ) => Promise<void>;
}

function period(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  summary: { totalIncome: 0, totalAllocated: 0, totalSpent: 0, totalBalance: 0, unallocated: 0 },
  monthSummaries: [],
  last7Days: [],
  balanceTrend: [],
  loading: false,

  fetchTransactions: async (db, limit = 50) => {
    set({ loading: true });
    const rows = await db.getAllAsync<TransactionWithLabel>(
      `SELECT t.*, s.name as income_source_name, a.name as allocation_name,
              a.color as allocation_color, a.icon as allocation_icon, acc.name as account_name
       FROM transactions t
       LEFT JOIN income_sources s ON s.id = t.income_source_id
       LEFT JOIN allocations a ON a.id = t.allocation_id
       LEFT JOIN accounts acc ON acc.id = t.account_id
       ORDER BY t.tx_date DESC, t.id DESC
       LIMIT ?`,
      [limit]
    );
    set({ transactions: rows, loading: false });
  },

  fetchSummary: async (db) => {
    const incomeRow = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'income'`
    );
    const expenseRow = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'expense'`
    );
    const p = period();
    const allocRow = await db.getFirstAsync<{ budget: number; spent: number }>(
      `SELECT COALESCE(SUM(budget_amount),0) as budget, COALESCE(SUM(spent_amount),0) as spent
       FROM allocations WHERE period = ?`,
      [p]
    );

    const totalIncome = incomeRow?.total ?? 0;
    const totalExpenseAll = expenseRow?.total ?? 0;
    const totalAllocated = allocRow?.budget ?? 0;
    const totalSpent = allocRow?.spent ?? 0;
    const totalBalance = totalIncome - totalExpenseAll;
    const unallocated = totalBalance - totalAllocated;

    set({ summary: { totalIncome, totalAllocated, totalSpent, totalBalance, unallocated } });
  },

  fetchMonthSummaries: async (db, months = 6) => {
    const rows = await db.getAllAsync<{ period: string; income: number; expense: number }>(
      `SELECT strftime('%Y-%m', tx_date) as period,
              COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as income,
              COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as expense
       FROM transactions
       GROUP BY period
       ORDER BY period DESC
       LIMIT ?`,
      [months]
    );
    set({
      monthSummaries: rows.map((r) => ({
        period: r.period,
        income: r.income,
        expense: r.expense,
        total: r.income - r.expense,
      })),
    });
  },

  fetchLast7Days: async (db) => {
    const rows = await db.getAllAsync<{ d: string; total: number }>(
      `SELECT substr(tx_date,1,10) as d, COALESCE(SUM(amount),0) as total
       FROM transactions
       WHERE type = 'expense' AND date(tx_date) >= date('now','-6 day','localtime')
       GROUP BY d
       ORDER BY d ASC`
    );
    const map: Record<string, number> = {};
    for (const r of rows) map[r.d] = r.total;
    const days: DayPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, total: map[key] ?? 0 });
    }
    set({ last7Days: days });
  },

  fetchBalanceTrend: async (db, months = 6) => {
    const rows = await db.getAllAsync<{ period: string; income: number; expense: number }>(
      `SELECT strftime('%Y-%m', tx_date) as period,
              COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as income,
              COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as expense
       FROM transactions
       GROUP BY period
       ORDER BY period ASC`
    );
    let running = 0;
    const all = rows.map((r) => {
      running += r.income - r.expense;
      return { period: r.period, balance: running };
    });
    set({ balanceTrend: all.slice(-months) });
  },

  addExpense: async (
    db,
    { amount, note, payee = '', allocationId = null, accountId = null, txDate, isCleared = true }
  ) => {
    const date = txDate ?? new Date().toISOString();
    if (allocationId) {
      await db.runAsync(
        `UPDATE allocations SET spent_amount = spent_amount + ?, updated_at = datetime('now','localtime') WHERE id = ?`,
        [amount, allocationId]
      );
    }
    if (accountId) {
      await db.runAsync(
        `UPDATE accounts SET balance = balance - ?, updated_at = datetime('now','localtime') WHERE id = ?`,
        [amount, accountId]
      );
    }
    await db.runAsync(
      `INSERT INTO transactions (type, amount, note, payee, allocation_id, account_id, tx_date, is_cleared)
       VALUES ('expense', ?, ?, ?, ?, ?, ?, ?)`,
      [amount, note, payee, allocationId, accountId, date, isCleared ? 1 : 0]
    );
  },
}));
