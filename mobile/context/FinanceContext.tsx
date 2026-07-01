import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getDb, restoreDefaultCategories } from '@/lib/database';
import { syncBillReminders } from '@/lib/notifications';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'investment' | 'credit';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  is_primary: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string | null;
  date: string;
  tags: string | null;
  notes: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  budget_limit: number;
  is_custom: number;
}

export interface Budget {
  id: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
  spent_amount: number;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  notes: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priority: 'low' | 'medium' | 'high';
  url: string | null;
  notes: string | null;
  is_purchased: number;
  created_at: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  is_paid: number;
  recurrence: 'monthly' | 'weekly' | 'yearly';
  next_due: string;
  notes: string | null;
}

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  amount: number;
  paid_amount: number;
  interest_rate: number;
  due_date: string | null;
  type: 'owed' | 'lending';
  notes: string | null;
}

export interface Investment {
  id: string;
  name: string;
  type: 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'other';
  amount: number;
  current_value: number;
  purchase_date: string;
  notes: string | null;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  date: string;
  created_at: string;
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  wishlist: WishlistItem[];
  bills: Bill[];
  debts: Debt[];
  investments: Investment[];
  journal: JournalEntry[];
  refreshAll: () => void;

  addTransaction: (t: Omit<Transaction, 'id' | 'created_at'>) => void;
  editTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addAccount: (a: Omit<Account, 'id' | 'created_at'>) => void;
  editAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addGoal: (g: Omit<Goal, 'id' | 'created_at'>) => void;
  editGoal: (id: string, g: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addBill: (b: Omit<Bill, 'id'>) => void;
  editBill: (id: string, b: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string) => void;

  addDebt: (d: Omit<Debt, 'id'>) => void;
  editDebt: (id: string, d: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  editInvestment: (id: string, inv: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  addJournalEntry: (j: Omit<JournalEntry, 'id' | 'created_at'>) => void;
  editJournalEntry: (id: string, j: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  addWishlistItem: (w: Omit<WishlistItem, 'id' | 'created_at'>) => void;
  editWishlistItem: (id: string, w: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  toggleWishlistPurchased: (id: string) => void;

  addBudget: (b: Omit<Budget, 'id'>) => void;
  editBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addCategory: (c: Omit<Category, 'id'>) => void;
  editCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  const refreshAll = useCallback(() => {
    try {
      const db = getDb();
      restoreDefaultCategories();
      setAccounts(db.getAllSync<Account>("SELECT * FROM accounts ORDER BY is_primary DESC, name ASC"));
      setTransactions(db.getAllSync<Transaction>("SELECT * FROM transactions ORDER BY date DESC, created_at DESC"));
      setCategories(db.getAllSync<Category>("SELECT * FROM categories ORDER BY is_custom ASC, name ASC"));
      setBudgets(db.getAllSync<Budget>("SELECT * FROM budgets"));
      setGoals(db.getAllSync<Goal>("SELECT * FROM goals ORDER BY created_at DESC"));
      setWishlist(db.getAllSync<WishlistItem>("SELECT * FROM wishlist ORDER BY priority DESC, created_at DESC"));
      setBills(db.getAllSync<Bill>("SELECT * FROM bills ORDER BY next_due ASC"));
      setDebts(db.getAllSync<Debt>("SELECT * FROM debts ORDER BY amount DESC"));
      setInvestments(db.getAllSync<Investment>("SELECT * FROM investments ORDER BY current_value DESC"));
      setJournal(db.getAllSync<JournalEntry>("SELECT * FROM journal ORDER BY date DESC"));
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  useEffect(() => {
    void syncBillReminders(bills);
  }, [bills]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'created_at'>) => {
    const db = getDb();
    const id = genId();
    const now = new Date().toISOString();
    db.withTransactionSync(() => {
      db.runSync(
        "INSERT INTO transactions (id, account_id, category_id, amount, type, description, date, tags, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, t.account_id, t.category_id ?? null, t.amount, t.type, t.description ?? null, t.date, t.tags ?? null, t.notes ?? null, now]
      );
      const delta = t.type === 'income' ? t.amount : -t.amount;
      if (t.type !== 'transfer') {
        db.runSync("UPDATE accounts SET balance = balance + ? WHERE id = ?", [delta, t.account_id]);
      }
    });
    refreshAll();
  }, [refreshAll]);

  const editTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    const db = getDb();
    const fields = Object.keys(t).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE transactions SET ${fields} WHERE id = ?`, [...Object.values(t), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteTransaction = useCallback((id: string) => {
    const db = getDb();
    const tx = db.getFirstSync<Transaction>("SELECT * FROM transactions WHERE id = ?", [id]);
    if (tx) {
      db.withTransactionSync(() => {
        db.runSync("DELETE FROM transactions WHERE id = ?", [id]);
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        if (tx.type !== 'transfer') {
          db.runSync("UPDATE accounts SET balance = balance + ? WHERE id = ?", [delta, tx.account_id]);
        }
      });
    }
    refreshAll();
  }, [refreshAll]);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'created_at'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO accounts (id, name, type, balance, currency, color, icon, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, a.name, a.type, a.balance, a.currency, a.color, a.icon, a.is_primary, new Date().toISOString()]
    );
    refreshAll();
  }, [refreshAll]);

  const editAccount = useCallback((id: string, a: Partial<Account>) => {
    const db = getDb();
    const fields = Object.keys(a).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE accounts SET ${fields} WHERE id = ?`, [...Object.values(a), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteAccount = useCallback((id: string) => {
    const db = getDb();
    db.withTransactionSync(() => {
      db.runSync("DELETE FROM transactions WHERE account_id = ?", [id]);
      db.runSync("DELETE FROM accounts WHERE id = ?", [id]);
    });
    refreshAll();
  }, [refreshAll]);

  const addGoal = useCallback((g: Omit<Goal, 'id' | 'created_at'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO goals (id, name, icon, color, target_amount, saved_amount, deadline, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, g.name, g.icon, g.color, g.target_amount, g.saved_amount, g.deadline ?? null, g.notes ?? null, new Date().toISOString()]
    );
    refreshAll();
  }, [refreshAll]);

  const editGoal = useCallback((id: string, g: Partial<Goal>) => {
    const db = getDb();
    const fields = Object.keys(g).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE goals SET ${fields} WHERE id = ?`, [...Object.values(g), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteGoal = useCallback((id: string) => {
    getDb().runSync("DELETE FROM goals WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  const addBill = useCallback((b: Omit<Bill, 'id'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO bills (id, name, amount, due_day, category_id, is_paid, recurrence, next_due, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, b.name, b.amount, b.due_day, b.category_id ?? null, b.is_paid, b.recurrence, b.next_due, b.notes ?? null]
    );
    refreshAll();
  }, [refreshAll]);

  const editBill = useCallback((id: string, b: Partial<Bill>) => {
    const db = getDb();
    const fields = Object.keys(b).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE bills SET ${fields} WHERE id = ?`, [...Object.values(b), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteBill = useCallback((id: string) => {
    getDb().runSync("DELETE FROM bills WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  const toggleBillPaid = useCallback((id: string) => {
    const db = getDb();
    const bill = db.getFirstSync<Bill>("SELECT * FROM bills WHERE id = ?", [id]);
    if (bill) db.runSync("UPDATE bills SET is_paid = ? WHERE id = ?", [bill.is_paid ? 0 : 1, id]);
    refreshAll();
  }, [refreshAll]);

  const addDebt = useCallback((d: Omit<Debt, 'id'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO debts (id, name, creditor, amount, paid_amount, interest_rate, due_date, type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, d.name, d.creditor, d.amount, d.paid_amount, d.interest_rate, d.due_date ?? null, d.type, d.notes ?? null]
    );
    refreshAll();
  }, [refreshAll]);

  const editDebt = useCallback((id: string, d: Partial<Debt>) => {
    const db = getDb();
    const fields = Object.keys(d).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE debts SET ${fields} WHERE id = ?`, [...Object.values(d), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteDebt = useCallback((id: string) => {
    getDb().runSync("DELETE FROM debts WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  const addInvestment = useCallback((inv: Omit<Investment, 'id'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO investments (id, name, type, amount, current_value, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, inv.name, inv.type, inv.amount, inv.current_value, inv.purchase_date, inv.notes ?? null]
    );
    refreshAll();
  }, [refreshAll]);

  const editInvestment = useCallback((id: string, inv: Partial<Investment>) => {
    const db = getDb();
    const fields = Object.keys(inv).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE investments SET ${fields} WHERE id = ?`, [...Object.values(inv), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteInvestment = useCallback((id: string) => {
    getDb().runSync("DELETE FROM investments WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  const addJournalEntry = useCallback((j: Omit<JournalEntry, 'id' | 'created_at'>) => {
    const db = getDb();
    const id = genId();
    const now = new Date().toISOString();
    db.runSync(
      "INSERT INTO journal (id, content, mood, date, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, j.content, j.mood, j.date, now]
    );
    refreshAll();
  }, [refreshAll]);

  const editJournalEntry = useCallback((id: string, j: Partial<JournalEntry>) => {
    const db = getDb();
    const fields = Object.keys(j).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE journal SET ${fields} WHERE id = ?`, [...Object.values(j), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteJournalEntry = useCallback((id: string) => {
    getDb().runSync("DELETE FROM journal WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  const addWishlistItem = useCallback((w: Omit<WishlistItem, 'id' | 'created_at'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO wishlist (id, name, price, priority, url, notes, is_purchased, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, w.name, w.price, w.priority, w.url ?? null, w.notes ?? null, w.is_purchased, new Date().toISOString()]
    );
    refreshAll();
  }, [refreshAll]);

  const editWishlistItem = useCallback((id: string, w: Partial<WishlistItem>) => {
    const db = getDb();
    const fields = Object.keys(w).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE wishlist SET ${fields} WHERE id = ?`, [...Object.values(w), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteWishlistItem = useCallback((id: string) => {
    getDb().runSync("DELETE FROM wishlist WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  const toggleWishlistPurchased = useCallback((id: string) => {
    const db = getDb();
    const item = db.getFirstSync<WishlistItem>("SELECT * FROM wishlist WHERE id = ?", [id]);
    if (item) db.runSync("UPDATE wishlist SET is_purchased = ? WHERE id = ?", [item.is_purchased ? 0 : 1, id]);
    refreshAll();
  }, [refreshAll]);

  const addBudget = useCallback((b: Omit<Budget, 'id'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO budgets (id, category_id, month, year, limit_amount, spent_amount) VALUES (?, ?, ?, ?, ?, ?)",
      [id, b.category_id, b.month, b.year, b.limit_amount, b.spent_amount]
    );
    refreshAll();
  }, [refreshAll]);

  const editBudget = useCallback((id: string, b: Partial<Budget>) => {
    const db = getDb();
    const fields = Object.keys(b).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE budgets SET ${fields} WHERE id = ?`, [...Object.values(b), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteBudget = useCallback((id: string) => {
    getDb().runSync("DELETE FROM budgets WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    const db = getDb();
    const id = genId();
    db.runSync(
      "INSERT INTO categories (id, name, icon, color, type, budget_limit, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, c.name, c.icon, c.color, c.type, c.budget_limit, 1]
    );
    refreshAll();
  }, [refreshAll]);

  const editCategory = useCallback((id: string, c: Partial<Category>) => {
    const db = getDb();
    const fields = Object.keys(c).map(k => `${k} = ?`).join(', ');
    db.runSync(`UPDATE categories SET ${fields} WHERE id = ?`, [...Object.values(c), id]);
    refreshAll();
  }, [refreshAll]);

  const deleteCategory = useCallback((id: string) => {
    getDb().runSync("DELETE FROM categories WHERE id = ?", [id]);
    refreshAll();
  }, [refreshAll]);

  return (
    <FinanceContext.Provider value={{
      accounts, transactions, categories, budgets, goals, wishlist, bills, debts, investments, journal,
      refreshAll,
      addTransaction, editTransaction, deleteTransaction,
      addAccount, editAccount, deleteAccount,
      addGoal, editGoal, deleteGoal,
      addBill, editBill, deleteBill, toggleBillPaid,
      addDebt, editDebt, deleteDebt,
      addInvestment, editInvestment, deleteInvestment,
      addJournalEntry, editJournalEntry, deleteJournalEntry,
      addWishlistItem, editWishlistItem, deleteWishlistItem, toggleWishlistPurchased,
      addBudget, editBudget, deleteBudget,
      addCategory, editCategory, deleteCategory,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}
