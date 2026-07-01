import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

class WebDb {
  private data: Record<string, any[]> = {
    accounts: [],
    transactions: [],
    categories: [
      { id: 'cat_1', name: 'Housing', icon: 'home-outline', color: '#6366F1', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_2', name: 'Food & Dining', icon: 'restaurant-outline', color: '#F59E0B', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_3', name: 'Transport', icon: 'car-outline', color: '#3B82F6', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_4', name: 'Salary', icon: 'briefcase-outline', color: '#10B981', type: 'income', budget_limit: 0, is_custom: 0 },
      { id: 'cat_5', name: 'Entertainment', icon: 'film-outline', color: '#8B5CF6', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_6', name: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_7', name: 'Health', icon: 'fitness-outline', color: '#EF4444', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_8', name: 'Travel', icon: 'airplane-outline', color: '#06B6D4', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_9', name: 'Utilities', icon: 'flash-outline', color: '#F97316', type: 'expense', budget_limit: 0, is_custom: 0 },
      { id: 'cat_10', name: 'Freelance', icon: 'laptop-outline', color: '#06B6D4', type: 'income', budget_limit: 0, is_custom: 0 },
    ],
    budgets: [],
    goals: [],
    wishlist: [],
    bills: [],
    debts: [],
    investments: [],
    journal: [],
  };

  private nextId = 1000;

  getAllSync<T>(sql: string, _params?: any[]): T[] {
    const table = this.tableFromSql(sql);
    return (table ? (this.data[table] || []) : []) as T[];
  }

  getFirstSync<T>(sql: string, params?: any[]): T | null {
    const table = this.tableFromSql(sql);
    if (!table) return null;
    const rows = this.data[table] || [];
    if (params && params.length) {
      return (rows.find(r => Object.values(r).includes(params[0])) || null) as T | null;
    }
    return (rows[0] || null) as T | null;
  }

  runSync(sql: string, params?: any[]) {
    const upperSql = sql.trim().toUpperCase();
    if (upperSql.startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT INTO (\w+)/i);
      const table = match?.[1]?.toLowerCase();
      if (table && this.data[table] !== undefined && params) {
        const cols = sql.match(/\(([^)]+)\)/)?.[1]?.split(',').map(c => c.trim()) || [];
        const obj: any = {};
        cols.forEach((col, i) => { obj[col] = params[i]; });
        this.data[table].push(obj);
      }
    } else if (upperSql.startsWith('UPDATE')) {
      const match = sql.match(/UPDATE (\w+) SET (.+) WHERE id = \?/i);
      if (match && params) {
        const table = match[1].toLowerCase();
        const id = params[params.length - 1];
        const idx = (this.data[table] || []).findIndex((r: any) => r.id === id);
        if (idx >= 0) {
          const setParts = match[2].split(',').map(s => s.trim());
          const updateParams = params.slice(0, -1);
          setParts.forEach((part, i) => {
            const col = part.split('=')[0].trim();
            this.data[table][idx][col] = updateParams[i];
          });
        }
      }
      const balMatch = sql.match(/UPDATE accounts SET balance = balance \+ \? WHERE id = \?/i);
      if (balMatch && params) {
        const table = 'accounts';
        const id = params[1];
        const idx = (this.data[table] || []).findIndex((r: any) => r.id === id);
        if (idx >= 0) this.data[table][idx].balance += params[0];
      }
    } else if (upperSql.startsWith('DELETE FROM')) {
      const match = sql.match(/DELETE FROM (\w+) WHERE id = \?/i);
      if (match && params) {
        const table = match[1].toLowerCase();
        this.data[table] = (this.data[table] || []).filter((r: any) => r.id !== params[0]);
      }
      const match2 = sql.match(/DELETE FROM (\w+) WHERE account_id = \?/i);
      if (match2 && params) {
        const table = match2[1].toLowerCase();
        this.data[table] = (this.data[table] || []).filter((r: any) => r.account_id !== params[0]);
      }
    }
  }

  execSync(_sql: string) {}

  withTransactionSync(fn: () => void) { fn(); }

  private tableFromSql(sql: string): string | null {
    const m = sql.match(/FROM\s+(\w+)/i);
    return m ? m[1].toLowerCase() : null;
  }
}

type DbInterface = {
  getAllSync<T>(sql: string, params?: any[]): T[];
  getFirstSync<T>(sql: string, params?: any[]): T | null;
  runSync(sql: string, params?: any[]): void;
  execSync(sql: string): void;
  withTransactionSync(fn: () => void): void;
};

let dbInstance: DbInterface | null = null;

export function getDb(): DbInterface {
  if (dbInstance) return dbInstance;

  if (Platform.OS === 'web') {
    dbInstance = new WebDb();
    return dbInstance;
  }

  try {
    const native = SQLite.openDatabaseSync('wealthly.db');
    initNativeDb(native);
    dbInstance = native as unknown as DbInterface;
  } catch (err) {
    console.warn('SQLite unavailable, using in-memory fallback:', err);
    dbInstance = new WebDb();
  }

  return dbInstance;
}

function initNativeDb(db: SQLite.SQLiteDatabase) {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      color TEXT,
      icon TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      tags TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      type TEXT NOT NULL,
      budget_limit REAL DEFAULT 0,
      is_custom INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      limit_amount REAL NOT NULL,
      spent_amount REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      target_amount REAL NOT NULL,
      saved_amount REAL DEFAULT 0,
      deadline TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      priority TEXT,
      url TEXT,
      notes TEXT,
      is_purchased INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_day INTEGER NOT NULL,
      category_id TEXT,
      is_paid INTEGER DEFAULT 0,
      recurrence TEXT,
      next_due TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      creditor TEXT,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      interest_rate REAL DEFAULT 0,
      due_date TEXT,
      type TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      current_value REAL NOT NULL,
      purchase_date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS journal (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      mood TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (count && count.count === 0) {
    seedDefaultCategories(db);
  }
}

function seedDefaultCategories(db: SQLite.SQLiteDatabase) {
  const categories = [
    ['cat_1', 'Housing', 'home-outline', '#6366F1', 'expense', 0],
    ['cat_2', 'Food & Dining', 'restaurant-outline', '#F59E0B', 'expense', 0],
    ['cat_3', 'Transport', 'car-outline', '#3B82F6', 'expense', 0],
    ['cat_4', 'Salary', 'briefcase-outline', '#10B981', 'income', 0],
    ['cat_5', 'Entertainment', 'film-outline', '#8B5CF6', 'expense', 0],
    ['cat_6', 'Shopping', 'bag-handle-outline', '#EC4899', 'expense', 0],
    ['cat_7', 'Health', 'fitness-outline', '#EF4444', 'expense', 0],
    ['cat_8', 'Travel', 'airplane-outline', '#06B6D4', 'expense', 0],
    ['cat_9', 'Utilities', 'flash-outline', '#F97316', 'expense', 0],
    ['cat_10', 'Freelance', 'laptop-outline', '#06B6D4', 'income', 0],
  ];
  db.withTransactionSync(() => {
    categories.forEach(c => {
      db.runSync(
        'INSERT INTO categories (id, name, icon, color, type, budget_limit, is_custom) VALUES (?, ?, ?, ?, ?, ?, 0)',
        c
      );
    });
  });
}
