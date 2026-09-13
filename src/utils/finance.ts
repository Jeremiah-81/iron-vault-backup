/**
 * FINANCIAL LOGIC AND UTILITIES FOR IRON VAULT
 * This file handles recurrence generation for transactions and computes running ledger
 * balances for Cash, Debit, and Credit accounts up to any given day.
 */

import type { Transaction, Account, AccountType } from '../types';

// Helper: Parse date string in YYYY-MM-DD format safely without timezone shift
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper: Format a Date object to YYYY-MM-DD locally
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns all instances of a transaction that occur between two dates (inclusive).
 * It calculates recurring occurrences based on the transaction frequency.
 */
export const getTransactionOccurrences = (
  tx: Transaction,
  rangeStartStr: string,
  rangeEndStr: string
): { date: string; amount: number; transaction: Transaction }[] => {
  const occurrences: { date: string; amount: number; transaction: Transaction }[] = [];
  const startLimit = parseLocalDate(rangeStartStr);
  const endLimit = parseLocalDate(rangeEndStr);
  
  const txStart = parseLocalDate(tx.date);
  
  // If the transaction start date is after the range limit, it can't have occurred yet
  if (txStart.getTime() > endLimit.getTime()) {
    return [];
  }

  // Handle one-time transactions
  if (tx.recurrence === 'once') {
    if (txStart.getTime() >= startLimit.getTime()) {
      const amt = tx.amountOverrides?.[tx.date] ?? tx.amount;
      occurrences.push({ date: tx.date, amount: amt, transaction: tx });
    }
    return occurrences;
  }

  // Handle recurring schedules
  const current = new Date(txStart);
  let safetyLoop = 0; // Prevent infinite loops in case of corrupt configurations

  while (current.getTime() <= endLimit.getTime() && safetyLoop < 1000) {
    safetyLoop++;
    const currentStr = formatLocalDate(current);

    // If current occurrence falls within requested window, record it
    if (current.getTime() >= startLimit.getTime()) {
      const amt = tx.amountOverrides?.[currentStr] ?? tx.amount;
      occurrences.push({ date: currentStr, amount: amt, transaction: tx });
    }

    // Advance date based on recurrence type
    switch (tx.recurrence) {
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'bi-weekly':
        current.setDate(current.getDate() + 14);
        break;
      case 'four-weekly':
        current.setDate(current.getDate() + 28);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'bi-monthly':
        current.setMonth(current.getMonth() + 2);
        break;
      case 'four-monthly':
        current.setMonth(current.getMonth() + 4);
        break;
      case 'six-monthly':
        current.setMonth(current.getMonth() + 6);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        return occurrences;
    }
  }

  return occurrences;
};

/**
 * Calculates the ending balance of a specific account on a given date (YYYY-MM-DD).
 * Takes initial balance and iterates through all historical occurrences up to targetDateStr.
 */
export const calculateAccountBalanceOnDate = (
  account: Account,
  transactions: Transaction[],
  targetDateStr: string
): number => {
  let runningVal = account.initialBalance;

  transactions.forEach((tx) => {
    if (tx.accountId !== account.id) return;
    const occurrences = getTransactionOccurrences(tx, '2020-01-01', targetDateStr);
    occurrences.forEach((occ) => {
      if (tx.type === 'income') {
        runningVal += occ.amount;
      } else {
        runningVal -= occ.amount;
      }
    });
  });

  return runningVal;
};

/**
 * Computes ledger balances (Cash, Debit, Credit) for a specific date range.
 * Calculates running balances day-by-day.
 */
export const calculateLedgerForMonth = (
  accounts: Account[],
  transactions: Transaction[],
  monthStartStr: string,
  monthEndStr: string
): Record<string, { cash: number; credit: number; debit: number; dailyExpenses: number }> => {
  const ledger: Record<string, { cash: number; credit: number; debit: number; dailyExpenses: number }> = {};
  
  // Step 1: Establish initial balances
  const currentBalances: Record<AccountType, number> = {
    cash: accounts.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.initialBalance, 0),
    debit: accounts.filter(a => a.type === 'debit').reduce((sum, a) => sum + a.initialBalance, 0),
    credit: accounts.filter(a => a.type === 'credit').reduce((sum, a) => sum + a.initialBalance, 0),
  };

  // Step 2: Accumulate all historical transactions up to the start of the month range
  // We need to know the running balance *before* the month begins.
  // We calculate from a safe epoch (e.g. 2020-01-01) up to the day before monthStartStr.
  const epochStart = '2020-01-01';
  const startLimit = parseLocalDate(monthStartStr);
  const dayBeforeStart = new Date(startLimit);
  dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
  const epochEndStr = formatLocalDate(dayBeforeStart);

  transactions.forEach((tx) => {
    const historicalOccurrences = getTransactionOccurrences(tx, epochStart, epochEndStr);
    const linkedAccount = accounts.find(a => a.id === tx.accountId);
    if (!linkedAccount) return;

    historicalOccurrences.forEach((occ) => {
      const type = linkedAccount.type;
      if (tx.type === 'income') {
        currentBalances[type] += occ.amount;
      } else {
        currentBalances[type] -= occ.amount;
      }
    });
  });

  // Step 3: Iterate day-by-day through the month range, calculating daily additions and ending balances
  const cursor = parseLocalDate(monthStartStr);
  const endLimitVal = parseLocalDate(monthEndStr);
  
  // Get all occurrences that fall within this month for faster lookup
  const monthOccurrences: { date: string; amount: number; tx: Transaction; accountType: AccountType }[] = [];
  transactions.forEach((tx) => {
    const linkedAccount = accounts.find(a => a.id === tx.accountId);
    if (!linkedAccount) return;

    const occurrences = getTransactionOccurrences(tx, monthStartStr, monthEndStr);
    occurrences.forEach((occ) => {
      monthOccurrences.push({
        date: occ.date,
        amount: occ.amount,
        tx: occ.transaction,
        accountType: linkedAccount.type
      });
    });
  });

  while (cursor.getTime() <= endLimitVal.getTime()) {
    const cursorStr = formatLocalDate(cursor);
    const dayOps = monthOccurrences.filter(o => o.date === cursorStr);
    
    let dailyExpensesTotal = 0;

    dayOps.forEach((op) => {
      if (op.tx.type === 'income') {
        currentBalances[op.accountType] += op.amount;
      } else {
        dailyExpensesTotal += op.amount;
        currentBalances[op.accountType] -= op.amount;
      }
    });

    // Save end-of-day balances and expenses for this date
    ledger[cursorStr] = {
      cash: currentBalances.cash,
      debit: currentBalances.debit,
      credit: currentBalances.credit,
      dailyExpenses: dailyExpensesTotal,
    };

    cursor.setDate(cursor.getDate() + 1);
  }

  return ledger;
};
