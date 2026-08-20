export type TransactionType = 'income' | 'allocation' | 'expense';

export interface IncomeSource {
  id: number;
  name: string;
  icon: string;
  color: string;
  initial_amount: number;
  current_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Allocation {
  id: number;
  name: string;
  icon: string;
  color: string;
  budget_amount: number;
  spent_amount: number;
  period: string; // format YYYY-MM
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  name: string;
  icon: string;
  color: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  note: string;
  payee: string;
  income_source_id: number | null;
  allocation_id: number | null;
  account_id: number | null;
  tx_date: string;
  is_cleared: number;
  created_at: string;
}
