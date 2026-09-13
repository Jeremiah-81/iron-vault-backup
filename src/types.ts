/**
 * TYPES DEFINITIONS FOR IRON VAULT
 * This file defines the core TypeScript interfaces and types used across the application.
 * It also defines the income and expense category details including their icons and visual styling.
 */

// Represents the types of financial accounts supported by Iron Vault
export type AccountType = 'cash' | 'credit' | 'debit';

// Represents a user-created financial account
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string; // Hex or CSS color variable
}

// Specifies the payment frequency for income and expenses
export type RecurrenceType = 
  | 'once'          // One-time payment
  | 'weekly'        // Occurs every 7 days
  | 'bi-weekly'      // Occurs every 14 days
  | 'four-weekly'   // Occurs every 28 days
  | 'monthly'       // Occurs on the same date every month
  | 'bi-monthly'    // Occurs every 2 months
  | 'four-monthly'  // Occurs every 4 months
  | 'six-monthly'   // Occurs every 6 months
  | 'yearly';       // Occurs on the same date every year

// Tracks whether a payment has actually occurred / cleared
export type TransactionStatus = 'paid' | 'not paid';

// Defines a transaction record, which can be a one-time entry or anchor a recurring schedule
export interface Transaction {
  id: string;
  accountId: string;          // Linked account ID
  amount: number;             // Base transaction amount
  type: 'income' | 'expense'; // Income or Expense indicator
  category: string;           // Selected category id (e.g. 'salary', 'groceries')
  description: string;        // Text notes entered by user
  date: string;               // Transaction start date in format YYYY-MM-DD
  recurrence: RecurrenceType; // How frequently it repeats
  status: TransactionStatus;  // Current payment status
  amountOverrides?: Record<string, number>; // Maps date string (YYYY-MM-DD) -> custom overridden amount if user adjusted it on a specific day
}

// Defines properties of an income or expense category
export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  isRecreation?: boolean; // Used to group expenses into required vs recreational
}

// Global lookup map for all supported categories in Iron Vault
export const CATEGORIES: Record<string, CategoryInfo> = {
  // --- Income Categories ---
  paycheck: { id: 'paycheck', name: 'Paycheck', icon: '💵', type: 'income' },
  salary: { id: 'salary', name: 'Salary', icon: '💼', type: 'income' },
  bonus: { id: 'bonus', name: 'Bonus', icon: '🏆', type: 'income' },
  tips: { id: 'tips', name: 'Tips', icon: '🪙', type: 'income' },
  income_other: { id: 'income_other', name: 'Other Income', icon: '➕', type: 'income' },

  // --- Required Living Expenses ---
  rent: { id: 'rent', name: 'Rent', icon: '🏠', type: 'expense' },
  mortgage: { id: 'mortgage', name: 'Mortgage', icon: '🏦', type: 'expense' },
  groceries: { id: 'groceries', name: 'Groceries', icon: '🛒', type: 'expense' },
  utilities: { id: 'utilities', name: 'Utilities', icon: '⚡', type: 'expense' },
  pets: { id: 'pets', name: 'Pets', icon: '🐾', type: 'expense' },
  education: { id: 'education', name: 'Education', icon: '🎓', type: 'expense' },
  gasoline: { id: 'gasoline', name: 'Gasoline', icon: '⛽', type: 'expense' },
  automobile: { id: 'automobile', name: 'Automobile', icon: '🚗', type: 'expense' },
  loans: { id: 'loans', name: 'Loans', icon: '💳', type: 'expense' },
  transportation: { id: 'transportation', name: 'Transportation', icon: '🚌', type: 'expense' },
  expense_other: { id: 'expense_other', name: 'Living Expenses', icon: '📦', type: 'expense' },

  // --- Recreational Expenses ---
  restaurants: { id: 'restaurants', name: 'Restaurants', icon: '🍔', type: 'expense', isRecreation: true },
  movies: { id: 'movies', name: 'Movie Tickets', icon: '🎬', type: 'expense', isRecreation: true },
  clothes: { id: 'clothes', name: 'New Clothes', icon: '🛍️', type: 'expense', isRecreation: true },
  vacations: { id: 'vacations', name: 'Vacations', icon: '✈️', type: 'expense', isRecreation: true },
};
