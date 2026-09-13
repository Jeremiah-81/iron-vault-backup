/**
 * MAIN APP CONTAINER (IRON VAULT)
 * 
 * This is the root component of the Iron Vault personal finance manager.
 * It manages:
 * 1. Global state: Accounts list, Transactions list, Pro license toggle, and app configurations.
 * 2. Local storage syncing to persist all ledger adjustments.
 * 3. Hamburger sidebar drawer integration.
 * 4. Active screen routing based on sidebar navigation choices.
 * 5. Theme synchronization (light vs dark mode custom HSL).
 */

import { useState, useEffect } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { Sidebar } from './components/Sidebar';
import type { ActiveScreen } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { PaymentsView } from './components/PaymentsView';
import { AccountsView } from './components/AccountsView';
import { BalanceTrackerView, IncomeExpenseGraphView, StatsTabsView } from './components/StatsViews';
import { SettingsView, HelpFeedbackView, PurchaseProView } from './components/SettingsViews';

import type { Transaction, Account, CategoryInfo } from './types';
import { CATEGORIES } from './types';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS } from './mockData';

function App() {
  // Theme state ('light' | 'dark'), defaults to dark mode for premium look
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ironvault-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Pro Upgrade license flag (one-time $4.99)
  const [isPro, setIsPro] = useState<boolean>(() => {
    const saved = localStorage.getItem('ironvault-ispro');
    return saved === 'true';
  });

  // General settings: Start week on Sunday vs Monday
  const [weekStartSunday, setWeekStartSunday] = useState<boolean>(() => {
    const saved = localStorage.getItem('ironvault-weekstart');
    return saved !== 'false'; // defaults to true
  });

  // General settings: What metrics to display inside calendar cells
  const [displayMode, setDisplayMode] = useState<'balance' | 'transactions_paid' | 'transactions_unpaid'>(() => {
    const saved = localStorage.getItem('ironvault-displaymode');
    return (saved === 'transactions_paid' || saved === 'transactions_unpaid') ? saved : 'balance';
  });

  // Global ledger accounts state
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('ironvault-accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // Global transaction records (both one-time and recurring events)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ironvault-transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Global categories state (allows editing category names & adding new ones)
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>(() => {
    const saved = localStorage.getItem('ironvault-categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return CATEGORIES;
      }
    }
    return CATEGORIES;
  });

  // Active view router screen
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('calendar');

  // Sidebar open indicator state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync theme changes to the DOM element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ironvault-theme', theme);
  }, [theme]);

  // Persistence hooks to cache updates to localStorage
  useEffect(() => {
    localStorage.setItem('ironvault-ispro', String(isPro));
  }, [isPro]);

  useEffect(() => {
    localStorage.setItem('ironvault-weekstart', String(weekStartSunday));
  }, [weekStartSunday]);

  useEffect(() => {
    localStorage.setItem('ironvault-displaymode', displayMode);
  }, [displayMode]);

  useEffect(() => {
    localStorage.setItem('ironvault-accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('ironvault-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ironvault-categories', JSON.stringify(categories));
  }, [categories]);

  // Transaction CRUD triggers
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [tx, ...prev]);
  };

  const handleEditTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Account creation trigger
  const handleAddAccount = (newAcc: Omit<Account, 'id'>) => {
    // Pro limit check: free users are limited to default accounts
    if (!isPro && accounts.length >= 3) {
      alert('🔒 Free tier limit reached: Upgrade to Iron Vault Pro to register unlimited accounts!');
      setActiveScreen('purchase');
      return;
    }

    const acc: Account = {
      ...newAcc,
      id: `acc-${Date.now()}`
    };
    setAccounts(prev => [...prev, acc]);
  };

  const handleEditAccount = (id: string, updatedFields: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
  };

  // Category editing handlers for Data Management
  const handleUpdateCategory = (id: string, updatedFields: Partial<CategoryInfo>) => {
    setCategories(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updatedFields
      }
    }));
  };

  const handleAddCategory = (newCat: CategoryInfo) => {
    setCategories(prev => ({
      ...prev,
      [newCat.id]: newCat
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleResetCategories = () => {
    setCategories(CATEGORIES);
    localStorage.removeItem('ironvault-categories');
    alert('Categories have been restored to default presets.');
  };

  // Wipe data function - clears all local data back to zero
  const handleClearAllData = () => {
    localStorage.removeItem('ironvault-accounts');
    localStorage.removeItem('ironvault-transactions');
    localStorage.removeItem('ironvault-categories');
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(CATEGORIES);
    setActiveScreen('calendar');
    alert('All accounts, transactions, and categories have been cleared back to initial zero values.');
  };

  // Screen router rendering
  const renderScreenContent = () => {
    switch (activeScreen) {
      case 'calendar':
        return (
          <CalendarView
            accounts={accounts}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isPro={isPro}
            onTriggerUpgrade={() => setActiveScreen('purchase')}
            weekStartSunday={weekStartSunday}
            displayMode={displayMode}
            categories={categories}
            onEditAccount={handleEditAccount}
          />
        );
      case 'payments':
        return <PaymentsView transactions={transactions} accounts={accounts} />;
      case 'accounts':
        return (
          <AccountsView 
            accounts={accounts} 
            transactions={transactions} 
            onAddAccount={handleAddAccount} 
            onEditAccount={handleEditAccount}
          />
        );
      case 'balance':
        return <BalanceTrackerView accounts={accounts} transactions={transactions} />;
      case 'income_expense':
        return <IncomeExpenseGraphView accounts={accounts} transactions={transactions} />;
      case 'stats':
        return <StatsTabsView accounts={accounts} transactions={transactions} />;
      case 'settings':
        return (
          <SettingsView
            isPro={isPro}
            onTriggerUpgrade={() => setActiveScreen('purchase')}
            weekStartSunday={weekStartSunday}
            setWeekStartSunday={setWeekStartSunday}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            onClearAllData={handleClearAllData}
            categories={categories}
            onUpdateCategory={handleUpdateCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onResetCategories={handleResetCategories}
          />
        );
      case 'help':
        return <HelpFeedbackView />;
      case 'purchase':
        return (
          <PurchaseProView
            onUpgradeSuccess={() => {
              setIsPro(true);
              setActiveScreen('calendar');
            }}
            onNavigateBack={() => setActiveScreen('calendar')}
          />
        );
      default:
        return null;
    }
  };

  // Format active screen headers nicely
  const getScreenTitle = () => {
    if (activeScreen === 'income_expense') return 'INCOME & EXPENSES';
    return activeScreen.toUpperCase();
  };

  return (
    <MobileFrame theme={theme} setTheme={setTheme}>
      {/* App Header with sliding sidebar trigger */}
      <div style={styles.appHeader}>
        <button 
          style={styles.hamburgerBtn} 
          onClick={() => setIsSidebarOpen(true)}
          title="Open Drawer Menu"
        >
          ☰
        </button>
        
        <h2 style={styles.headerTitle}>{getScreenTitle()}</h2>

        <div 
          style={{ ...styles.badgeWrapper, cursor: 'pointer' }}
          onClick={() => {
            setIsPro(prev => !prev);
            alert(`Developer sandbox tier switched to: ${!isPro ? 'PRO 💎' : 'FREE 🛡️'}`);
          }}
          title="Click to toggle sandbox test tier"
        >
          <span style={styles.proLabel(isPro)}>
            {isPro ? 'PRO 💎' : 'FREE 🛡️'}
          </span>
        </div>
      </div>

      {/* Primary screen content */}
      <div style={styles.mainContent}>
        {renderScreenContent()}
      </div>

      {/* Navigation Sidebar overlay drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        isPro={isPro}
      />
    </MobileFrame>
  );
}

const styles: Record<string, any> = {
  appHeader: {
    height: '56px',
    backgroundColor: 'var(--bg-phone)',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    position: 'relative',
    zIndex: 250,
  },
  hamburgerBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.92rem',
    fontWeight: 800,
    letterSpacing: '1.5px',
    color: 'var(--text-primary)',
    textAlign: 'center',
  },
  badgeWrapper: {
    minWidth: '50px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  proLabel: (isPro: boolean) => ({
    fontSize: '0.62rem',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
    background: isPro ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'var(--bg-card)',
    color: isPro ? '#000' : 'var(--text-secondary)',
    letterSpacing: '0.5px',
  }),
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    position: 'relative',
  }
};

export default App;
