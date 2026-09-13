/**
 * PAYMENTS VIEW COMPONENT
 * Renders a searchable and highly filterable log of all transactions.
 * Allows filtering by account types (Cash, Credit, Debit) and payment status.
 */

import React, { useState } from 'react';
import type { Transaction, Account, AccountType } from '../types';
import { CATEGORIES } from '../types';

interface PaymentsViewProps {
  transactions: Transaction[];
  accounts: Account[];
}

// Allowed filter statuses for payments list
type FilterStatus = 'all' | 'made' | 'income' | 'paid' | 'unpaid';

export const PaymentsView: React.FC<PaymentsViewProps> = ({ transactions, accounts }) => {
  // Filter settings states
  const [filterAccountType, setFilterAccountType] = useState<'all' | AccountType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Apply filters to transactions list
  const filteredTransactions = transactions.filter((tx) => {
    // Linked Account
    const acc = accounts.find((a) => a.id === tx.accountId);
    if (!acc) return false;

    // Search Query Match
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (CATEGORIES[tx.category]?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Account Type Filter
    const matchesAccountType = filterAccountType === 'all' || acc.type === filterAccountType;

    // Account ID Filter
    const matchesAccountId = filterAccountId === 'all' || tx.accountId === filterAccountId;

    // Status Filter (Payments Made = Expenses, Income = Incomes, Paid, Not Paid)
    let matchesStatus = true;
    if (filterStatus === 'made') {
      matchesStatus = tx.type === 'expense';
    } else if (filterStatus === 'income') {
      matchesStatus = tx.type === 'income';
    } else if (filterStatus === 'paid') {
      matchesStatus = tx.status === 'paid';
    } else if (filterStatus === 'unpaid') {
      matchesStatus = tx.status === 'not paid';
    }

    return matchesSearch && matchesAccountType && matchesAccountId && matchesStatus;
  });

  // Calculate stats for the filtered list
  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* View Header with Filter toggle */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>Payments Feed</h2>
          <span style={styles.subtitle}>Audit transaction logs</span>
        </div>
        
        {/* Toggle Filter overlay button */}
        <button 
          style={styles.filterToggleBtn(showFilterDropdown)} 
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          🔍 Filters
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      {showFilterDropdown && (
        <div className="glass-panel" style={styles.filterPanel}>
          <div style={styles.filterGrid}>
            
            {/* Account Type categories filter */}
            <div className="input-group">
              <span className="input-label" style={{ fontSize: '0.65rem' }}>Account Type</span>
              <select 
                value={filterAccountType} 
                onChange={(e) => setFilterAccountType(e.target.value as 'all' | AccountType)}
                className="form-input"
                style={{ padding: '8px' }}
              >
                <option value="all">All Types (Cash/Debit/Credit)</option>
                <option value="cash">Cash Only</option>
                <option value="debit">Debit Only</option>
                <option value="credit">Credit Only</option>
              </select>
            </div>

            {/* Individual Accounts Filter */}
            <div className="input-group">
              <span className="input-label" style={{ fontSize: '0.65rem' }}>Specific Account</span>
              <select 
                value={filterAccountId} 
                onChange={(e) => setFilterAccountId(e.target.value)}
                className="form-input"
                style={{ padding: '8px' }}
              >
                <option value="all">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Status / Transaction Type Filter */}
            <div className="input-group">
              <span className="input-label" style={{ fontSize: '0.65rem' }}>Payment Status Filter</span>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="form-input"
                style={{ padding: '8px' }}
              >
                <option value="all">All Records</option>
                <option value="made">Payments Made (Expenses)</option>
                <option value="income">Income</option>
                <option value="paid">Paid / Cleared</option>
                <option value="unpaid">Not Paid / Unpaid</option>
              </select>
            </div>
          </div>

          {/* Reset Filters button */}
          <button 
            style={styles.resetFiltersBtn}
            onClick={() => {
              setFilterAccountType('all');
              setFilterStatus('all');
              setFilterAccountId('all');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Main Search Input */}
      <input
        type="text"
        placeholder="Search description or category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="form-input"
        style={styles.searchInput}
      />

      {/* Aggregate Statistics for filtered list */}
      <div className="glass-panel" style={styles.statsCard}>
        <div style={{ textAlign: 'left' }}>
          <span style={styles.statsLabel}>Filtered Entries Count</span>
          <div style={styles.statsVal}>{filteredTransactions.length}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={styles.statsLabel}>Running Total Amount</span>
          <div style={styles.statsVal}>${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* LIST OF TRANSACTIONS */}
      <div style={styles.listContainer}>
        {filteredTransactions.length === 0 ? (
          <div style={styles.emptyState}>No payments match your search criteria.</div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = CATEGORIES[tx.category];
            const acc = accounts.find((a) => a.id === tx.accountId);
            const isIncome = tx.type === 'income';

            return (
              <div key={tx.id} className="glass-panel animate-fade-in-up" style={styles.txItem}>
                <div style={styles.itemLeft}>
                  {/* Category icon */}
                  <span style={styles.catIcon}>{cat?.icon || '📦'}</span>
                  <div>
                    <div style={styles.txDesc}>{tx.description}</div>
                    <div style={styles.txMeta}>
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {cat?.name}
                    </div>
                  </div>
                </div>

                <div style={styles.itemRight}>
                  {/* Amount and linked Account */}
                  <div style={styles.txAmount(isIncome)}>
                    {isIncome ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={styles.accBadge(acc?.type || 'cash')}>
                    {acc?.name}
                  </div>
                  <span style={styles.statusLabelVal(tx.status === 'paid')}>
                    {tx.status === 'paid' ? 'Paid' : 'Not paid'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    paddingBottom: '90px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)',
  },
  filterToggleBtn: (isOpen: boolean) => ({
    background: isOpen ? 'var(--primary)' : 'var(--bg-card)',
    color: isOpen ? 'white' : 'var(--text-secondary)',
    border: '1px solid var(--border-light)',
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 650,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  filterPanel: {
    padding: '14px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  filterGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  resetFiltersBtn: {
    background: 'none',
    border: '1px solid var(--border-light)',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--expense)',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    fontSize: '0.88rem',
    borderRadius: 'var(--radius-md)',
  },
  statsCard: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    borderRadius: '14px',
    background: 'var(--bg-card-hover)',
    border: '1px solid var(--border-light)',
  },
  statsLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statsVal: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 700,
    marginTop: '2px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  txItem: {
    padding: '12px 14px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  catIcon: {
    fontSize: '1.4rem',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-input)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDesc: {
    fontWeight: 700,
    fontSize: '0.88rem',
  },
  txMeta: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
    marginTop: '3px',
  },
  itemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  txAmount: (isIncome: boolean) => ({
    fontFamily: 'var(--font-display)',
    fontWeight: 750,
    fontSize: '0.92rem',
    color: isIncome ? 'var(--income)' : 'var(--text-primary)',
  }),
  accBadge: (type: 'cash' | 'credit' | 'debit') => {
    let color = 'var(--text-secondary)';
    let bg = 'var(--bg-input)';
    if (type === 'cash') {
      color = 'var(--income)';
      bg = 'var(--income-glow)';
    } else if (type === 'credit') {
      color = 'var(--expense)';
      bg = 'var(--expense-glow)';
    } else if (type === 'debit') {
      color = 'var(--primary)';
      bg = 'var(--primary-glow)';
    }
    return {
      fontSize: '0.62rem',
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: bg,
      color: color,
    };
  },
  statusLabelVal: (isPaid: boolean) => ({
    fontSize: '0.65rem',
    fontWeight: 700,
    color: isPaid ? 'var(--income)' : 'var(--budget-warning)',
  }),
  emptyState: {
    textAlign: 'center',
    padding: '30px 0',
    color: 'var(--text-tertiary)',
    fontSize: '0.82rem',
  }
};
