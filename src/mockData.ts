/**
 * MOCK DATA SETUPS FOR IRON VAULT
 * This file creates standard placeholder accounts and transactions to give the application
 * a realistic state upon first boot. All transactions are linked to specific accounts and
 * demonstrate different recurrence intervals (weekly, bi-weekly, monthly, one-time).
 */

import type { Account, Transaction } from './types';

// Default Accounts for Cash, Debit, and Credit types with designated colors
// Cash uses Green, Credit uses Gold, Debit uses Blue as requested.
export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    name: 'Cash Wallet',
    type: 'cash',
    initialBalance: 0.00,
    color: '#142, 72%, 45%' // Green (HSL values: hsl(142, 72%, 45%))
  },
  {
    id: 'acc-debit',
    name: 'Checking Account (Debit)',
    type: 'debit',
    initialBalance: 0.00,
    color: '190, 90%, 50%' // Blue (HSL values: hsl(190, 90%, 50%))
  },
  {
    id: 'acc-credit',
    name: 'Rewards Card (Credit)',
    type: 'credit',
    initialBalance: 0.00, // Credit balance represents money owed/spent
    color: '43, 96%, 56%' // Gold (HSL values: hsl(43, 96%, 56%))
  }
];

// Default Transaction records to pre-populate the calendar, ledger, and stats (start empty for clean slate)
export const INITIAL_TRANSACTIONS: Transaction[] = [];
