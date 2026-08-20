import * as SQLite from 'expo-sqlite';

export type SQLiteDatabase = SQLite.SQLiteDatabase;

/**
 * Skema database FinanceKu
 *
 * income_sources  -> sumber pemasukan (Gaji, Bonus, Freelance, dll)
 *                    initial_amount = nominal saat sumber ini dibuat/diisi ulang
 *                    current_amount = sisa saldo dari sumber ini yang belum dialokasikan/dipakai
 * allocations     -> "kantong"/pos anggaran (mis. Tabungan, Makan, Tws)
 *                    budget_amount = total yang dialokasikan ke kantong ini bulan berjalan
 *                    spent_amount  = total yang sudah dipakai dari kantong ini
 * transactions    -> jejak semua pergerakan uang:
 *                      type: 'income'     -> nambah saldo (dari income_source)
 *                            'allocation' -> pindah dari "belum dialokasi" ke sebuah kantong
 *                            'expense'    -> pengeluaran, mengurangi kantong (allocation) atau saldo umum
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 2;
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentDbVersion = versionRow?.user_version ?? 0;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('display_name', 'Saya');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'IDR');
  `);

  if (currentDbVersion >= DATABASE_VERSION) return;

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS income_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'payments',
        color TEXT NOT NULL DEFAULT '#10B981',
        initial_amount REAL NOT NULL DEFAULT 0,
        current_amount REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'savings',
        color TEXT NOT NULL DEFAULT '#3B82F6',
        budget_amount REAL NOT NULL DEFAULT 0,
        spent_amount REAL NOT NULL DEFAULT 0,
        period TEXT NOT NULL DEFAULT (strftime('%Y-%m','now','localtime')),
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK (type IN ('income','allocation','expense')),
        amount REAL NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        income_source_id INTEGER REFERENCES income_sources(id) ON DELETE SET NULL,
        allocation_id INTEGER REFERENCES allocations(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
    `);
    currentDbVersion = 1;
  }

  if (currentDbVersion === 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'account-balance-wallet',
        color TEXT NOT NULL DEFAULT '#3B82F6',
        balance REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      INSERT INTO accounts (name, icon, color, balance)
        SELECT 'Dompet', 'account-balance-wallet', '#3B82F6', COALESCE((
          SELECT SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END)
          FROM transactions
        ), 0)
      WHERE NOT EXISTS (SELECT 1 FROM accounts);

      ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
      ALTER TABLE transactions ADD COLUMN payee TEXT NOT NULL DEFAULT '';
      ALTER TABLE transactions ADD COLUMN tx_date TEXT;
      ALTER TABLE transactions ADD COLUMN is_cleared INTEGER NOT NULL DEFAULT 1;

      UPDATE transactions SET tx_date = created_at WHERE tx_date IS NULL;
      UPDATE transactions SET account_id = (SELECT id FROM accounts ORDER BY id LIMIT 1) WHERE account_id IS NULL;

      CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(tx_date);
    `);
    currentDbVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
