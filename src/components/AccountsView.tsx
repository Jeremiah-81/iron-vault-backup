/**
 * ACCOUNTS MANAGEMENT VIEW
 * 
 * Shows a grid of all active accounts (Cash, Debit, Credit).
 * For each account, it calculates the current balance based on historical transactions.
 * Includes a "+" button in the header to create custom accounts.
 */

import React, { useState } from 'react';
import type { Account, AccountType, Transaction } from '../types';
import { calculateAccountBalanceOnDate, formatLocalDate } from '../utils/finance';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onEditAccount: (id: string, fields: Partial<Account>) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  onAddAccount,
  onEditAccount
}) => {
  // Toggle states for adding account modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [initialBalance, setInitialBalance] = useState('');

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isNaN(Number(initialBalance)) || Number(initialBalance) < 0) return;

    // Automatically set designated colors matching requested guidelines:
    // Green for cash, gold for credit, blue for debit.
    let color = '142, 72%, 45%'; // Green
    if (type === 'credit') color = '43, 96%, 56%'; // Gold
    else if (type === 'debit') color = '190, 90%, 50%'; // Blue

    onAddAccount({
      name: name.trim(),
      type,
      initialBalance: Number(initialBalance),
      color
    });

    // Reset fields
    setName('');
    setInitialBalance('');
    setShowAddModal(false);
  };

  /**
   * Calculates the current balance of an account up to today.
   * Runs through the transaction recurrence logs and aggregates all entries.
   */
  const calculateCurrentBalance = (acc: Account) => {
    const todayStr = formatLocalDate(new Date());
    return calculateAccountBalanceOnDate(acc, transactions, todayStr);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      
      {/* Header bar with custom Add Account button */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>My Accounts</h2>
          <span style={styles.subtitle}>Audit cash, credit, & debit profiles</span>
        </div>
        <button 
          className="btn-primary" 
          style={styles.addAccountBtn}
          onClick={() => setShowAddModal(true)}
        >
          + Add Account
        </button>
      </div>

      {/* ACCOUNTS LISTING GRID */}
      <div style={styles.grid}>
        {accounts.map((acc) => {
          const balance = calculateCurrentBalance(acc);
          
          return (
            <div 
              key={acc.id} 
              className="glass-panel" 
              style={styles.accCard(acc.color)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.accIcon(acc.type)}>
                  {acc.type === 'cash' ? '💵' : acc.type === 'credit' ? '💳' : '🏦'}
                </span>
                <span style={styles.typeBadge(acc.type)}>{acc.type.toUpperCase()}</span>
              </div>

              <div style={styles.cardBody}>
                <h3 style={styles.accName}>{acc.name}</h3>
                <div style={styles.accBalance}>
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div 
                  style={{ ...styles.initialText, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    const newBal = prompt(`Set starting balance for ${acc.name}:`, acc.initialBalance.toString());
                    if (newBal !== null && !isNaN(Number(newBal)) && Number(newBal) >= 0) {
                      onEditAccount(acc.id, { initialBalance: Number(newBal) });
                    }
                  }}
                  title="Click to change starting balance"
                >
                  Initial Deposit: ${acc.initialBalance.toFixed(2)} ✏️
                </div>
              </div>

              <div style={styles.cardGlow(acc.color)} />
            </div>
          );
        })}
      </div>

      {/* SLIDE-UP DIALOG PANEL FOR CREATING ACCOUNTS */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className="glass-panel animate-fade-in-up" style={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Account</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              
              <div className="input-group">
                <span className="input-label">Account Profile Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chase Checking, Cash Envelope"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="input-group">
                <span className="input-label">Account Category</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="form-input"
                >
                  <option value="cash">Cash (Green Dashboard Accent)</option>
                  <option value="debit">Debit Account (Blue Dashboard Accent)</option>
                  <option value="credit">Credit Card / Debt (Red Dashboard Accent)</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">Starting Balance ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                Save Account Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, any> = {
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  addAccountBtn: {
    padding: '8px 14px',
    fontSize: '0.75rem',
    borderRadius: '12px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  accCard: (hslColor: string) => ({
    position: 'relative',
    background: `linear-gradient(135deg, hsla(${hslColor}, 0.25) 0%, hsla(${hslColor}, 0.05) 100%)`,
    borderColor: `hsla(${hslColor}, 0.3)`,
    padding: '18px',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }),
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  accIcon: (_type: AccountType) => ({
    fontSize: '1.3rem',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-input)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  typeBadge: (type: AccountType) => {
    let color = 'var(--text-secondary)';
    if (type === 'cash') color = 'var(--income)';
    else if (type === 'credit') color = 'var(--credit)';
    else if (type === 'debit') color = 'var(--primary)';
    return {
      fontSize: '0.62rem',
      fontWeight: 800,
      color,
      letterSpacing: '0.5px',
    };
  },
  cardBody: {
    zIndex: 2,
  },
  accName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  accBalance: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    marginTop: '4px',
  },
  initialText: {
    fontSize: '0.68rem',
    color: 'var(--text-tertiary)',
    marginTop: '4px',
  },
  cardGlow: (hslColor: string) => ({
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '120px',
    height: '120px',
    background: `hsl(${hslColor})`,
    opacity: 0.1,
    borderRadius: '50%',
    filter: 'blur(30px)',
    zIndex: 1,
  }),
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(5px)',
    zIndex: 400,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    borderRadius: '24px 24px 0 0',
    padding: '24px',
    maxHeight: '90%',
    overflowY: 'auto',
    borderBottom: 'none',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  }
};
