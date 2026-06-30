import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

// Web fallback — expo-sqlite sync API requires SharedArrayBuffer (COOP/COEP)
// which isn't available in the Expo web preview. We provide a no-op stub so the
// UI loads on web; on iOS/Android the real SQLite DB is used.
class WebDb {
  private data: Record<string, any[]> = {
    accounts: [
      { id: 'acc_1', name: 'Main Checking', type: 'checking', balance: 4250.50, currency: 'USD', color: '#10B981', icon: 'wallet-outline', is_primary: 1, created_at: new Date().toISOString() },
      { id: 'acc_2', name: 'High Yield Savings', type: 'savings', balance: 12500.00, currency: 'USD', color: '#6366F1', icon: 'wallet-outline', is_primary: 0, created_at: new Date().toISOString() },
    ],
    transactions: [
      { id: 'txn_1', account_id: 'acc_1', category_id: 'cat_4', amount: 5200, type: 'income', description: 'Tech Corp Salary', date: new Date(Date.now() - 86400000 * 5).toISOString(), tags: null, notes: null, created_at: new Date().toISOString() },
      { id: 'txn_2', account_id: 'acc_1', category_id: 'cat_1', amount: 1850, type: 'expense', description: 'Rent Payment', date: new Date(Date.now() - 86400000 * 3).toISOString(), tags: null, notes: null, created_at: new Date().toISOString() },
      { id: 'txn_3', account_id: 'acc_1', category_id: 'cat_2', amount: 85.50, type: 'expense', description: 'Whole Foods Market', date: new Date(Date.now() - 86400000 * 1).toISOString(), tags: null, notes: null, created_at: new Date().toISOString() },
      { id: 'txn_4', account_id: 'acc_1', category_id: 'cat_2', amount: 45, type: 'expense', description: 'Local Coffee Shop', date: new Date().toISOString(), tags: null, notes: null, created_at: new Date().toISOString() },
      { id: 'txn_5', account_id: 'acc_2', category_id: 'cat_4', amount: 800, type: 'income', description: 'Freelance Payment', date: new Date(Date.now() - 86400000 * 2).toISOString(), tags: null, notes: null, created_at: new Date().toISOString() },
    ],
    categories: [
      { id: 'cat_1', name: 'Housing', icon: 'home-outline', color: '#6366F1', type: 'expense', budget_limit: 2000, is_custom: 0 },
      { id: 'cat_2', name: 'Food & Dining', icon: 'restaurant-outline', color: '#F59E0B', type: 'expense', budget_limit: 600, is_custom: 0 },
      { id: 'cat_3', name: 'Transport', icon: 'car-outline', color: '#3B82F6', type: 'expense', budget_limit: 300, is_custom: 0 },
      { id: 'cat_4', name: 'Salary', icon: 'briefcase-outline', color: '#10B981', type: 'income', budget_limit: 0, is_custom: 0 },
      { id: 'cat_5', name: 'Entertainment', icon: 'film-outline', color: '#8B5CF6', type: 'expense', budget_limit: 200, is_custom: 0 },
      { id: 'cat_6', name: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899', type: 'expense', budget_limit: 300, is_custom: 0 },
      { id: 'cat_7', name: 'Health', icon: 'fitness-outline', color: '#EF4444', type: 'expense', budget_limit: 150, is_custom: 0 },
      { id: 'cat_8', name: 'Travel', icon: 'airplane-outline', color: '#06B6D4', type: 'expense', budget_limit: 0, is_custom: 0 },
    ],
    budgets: [
      { id: 'bud_1', category_id: 'cat_1', month: new Date().getMonth() + 1, year: new Date().getFullYear(), limit_amount: 2000, spent_amount: 1850 },
      { id: 'bud_2', category_id: 'cat_2', month: new Date().getMonth() + 1, year: new Date().getFullYear(), limit_amount: 600, spent_amount: 130.50 },
      { id: 'bud_3', category_id: 'cat_5', month: new Date().getMonth() + 1, year: new Date().getFullYear(), limit_amount: 200, spent_amount: 45 },
    ],
    goals: [
      { id: 'goal_1', name: 'Vacation Fund', icon: 'airplane', color: '#06B6D4', target_amount: 3000, saved_amount: 1200, deadline: null, notes: null, created_at: new Date().toISOString() },
      { id: 'goal_2', name: 'Emergency Fund', icon: 'shield-outline', color: '#10B981', target_amount: 10000, saved_amount: 4500, deadline: null, notes: null, created_at: new Date().toISOString() },
    ],
    wishlist: [
      { id: 'wish_1', name: 'MacBook Pro', price: 2499, priority: 'high', url: null, notes: 'For work', is_purchased: 0, created_at: new Date().toISOString() },
      { id: 'wish_2', name: 'Standing Desk', price: 599, priority: 'medium', url: null, notes: null, is_purchased: 0, created_at: new Date().toISOString() },
    ],
    bills: [
      { id: 'bill_1', name: 'Netflix', amount: 15.99, due_day: 15, category_id: 'cat_5', is_paid: 0, recurrence: 'monthly', next_due: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0], notes: null },
      { id: 'bill_2', name: 'Internet', amount: 79.99, due_day: 1, category_id: 'cat_1', is_paid: 1, recurrence: 'monthly', next_due: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], notes: null },
    ],
    debts: [
      { id: 'debt_1', name: 'Student Loan', creditor: 'Navient', amount: 25000, paid_amount: 8500, interest_rate: 4.5, due_date: null, type: 'owed', notes: null },
    ],
    investments: [
      { id: 'inv_1', name: 'S&P 500 Index', type: 'stocks', amount: 5000, current_value: 6240, purchase_date: '2024-01-15', notes: null },
      { id: 'inv_2', name: 'Bitcoin', type: 'crypto', amount: 1000, current_value: 1380, purchase_date: '2024-06-01', notes: null },
    ],
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
      if (table && this.data[table] && params) {
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
      // Handle balance updates
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
    seedNativeData(db);
  }
}

function seedNativeData(db: SQLite.SQLiteDatabase) {
  const now = new Date().toISOString();
  const today = new Date();

  db.withTransactionSync(() => {
    db.runSync(
      'INSERT INTO accounts (id, name, type, balance, currency, color, icon, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['acc_1', 'Main Checking', 'checking', 4250.50, 'USD', '#10B981', 'wallet-outline', 1, now]
    );
    db.runSync(
      'INSERT INTO accounts (id, name, type, balance, currency, color, icon, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['acc_2', 'High Yield Savings', 'savings', 12500.00, 'USD', '#6366F1', 'wallet-outline', 0, now]
    );

    const categories = [
      ['cat_1', 'Housing', 'home-outline', '#6366F1', 'expense', 2000],
      ['cat_2', 'Food & Dining', 'restaurant-outline', '#F59E0B', 'expense', 600],
      ['cat_3', 'Transport', 'car-outline', '#3B82F6', 'expense', 300],
      ['cat_4', 'Salary', 'briefcase-outline', '#10B981', 'income', 0],
      ['cat_5', 'Entertainment', 'film-outline', '#8B5CF6', 'expense', 200],
      ['cat_6', 'Shopping', 'bag-handle-outline', '#EC4899', 'expense', 300],
      ['cat_7', 'Health', 'fitness-outline', '#EF4444', 'expense', 150],
      ['cat_8', 'Travel', 'airplane-outline', '#06B6D4', 'expense', 0],
    ];
    categories.forEach(c => {
      db.runSync(
        'INSERT INTO categories (id, name, icon, color, type, budget_limit, is_custom) VALUES (?, ?, ?, ?, ?, ?, 0)',
        c
      );
    });

    const transactions = [
      ['txn_1', 'acc_1', 'cat_4', 5200, 'income', 'Tech Corp Salary', new Date(today.getTime() - 86400000 * 5).toISOString()],
      ['txn_2', 'acc_1', 'cat_1', 1850, 'expense', 'Rent Payment', new Date(today.getTime() - 86400000 * 3).toISOString()],
      ['txn_3', 'acc_1', 'cat_2', 85.50, 'expense', 'Whole Foods Market', new Date(today.getTime() - 86400000 * 1).toISOString()],
      ['txn_4', 'acc_1', 'cat_2', 45, 'expense', 'Local Coffee Shop', today.toISOString()],
      ['txn_5', 'acc_2', 'cat_4', 800, 'income', 'Freelance Payment', new Date(today.getTime() - 86400000 * 2).toISOString()],
    ];
    transactions.forEach(t => {
      db.runSync(
        'INSERT INTO transactions (id, account_id, category_id, amount, type, description, date, tags, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)',
        [...t, now]
      );
    });

    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    db.runSync('INSERT INTO budgets (id, category_id, month, year, limit_amount, spent_amount) VALUES (?, ?, ?, ?, ?, ?)', ['bud_1', 'cat_1', month, year, 2000, 1850]);
    db.runSync('INSERT INTO budgets (id, category_id, month, year, limit_amount, spent_amount) VALUES (?, ?, ?, ?, ?, ?)', ['bud_2', 'cat_2', month, year, 600, 130.50]);

    db.runSync('INSERT INTO goals (id, name, icon, color, target_amount, saved_amount, deadline, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)', ['goal_1', 'Vacation Fund', 'airplane', '#06B6D4', 3000, 1200, now]);
    db.runSync('INSERT INTO goals (id, name, icon, color, target_amount, saved_amount, deadline, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)', ['goal_2', 'Emergency Fund', 'shield-outline', '#10B981', 10000, 4500, now]);

    db.runSync('INSERT INTO bills (id, name, amount, due_day, category_id, is_paid, recurrence, next_due, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)', ['bill_1', 'Netflix', 15.99, 15, 'cat_5', 0, 'monthly', new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]]);
    db.runSync('INSERT INTO bills (id, name, amount, due_day, category_id, is_paid, recurrence, next_due, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)', ['bill_2', 'Internet', 79.99, 1, 'cat_1', 1, 'monthly', new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]]);

    db.runSync('INSERT INTO debts (id, name, creditor, amount, paid_amount, interest_rate, due_date, type, notes) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL)', ['debt_1', 'Student Loan', 'Navient', 25000, 8500, 4.5, 'owed']);
    db.runSync('INSERT INTO investments (id, name, type, amount, current_value, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, NULL)', ['inv_1', 'S&P 500 Index', 'stocks', 5000, 6240, '2024-01-15']);
    db.runSync('INSERT INTO investments (id, name, type, amount, current_value, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, NULL)', ['inv_2', 'Bitcoin', 'crypto', 1000, 1380, '2024-06-01']);
  });
}
