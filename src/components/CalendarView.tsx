/**
 * CALENDAR VIEW COMPONENT WITH DAILY LEDGER BALANCE
 * 
 * This is the core interactive screen of Iron Vault. It renders:
 * 1. Month-to-month navigation, enforcing a 2-month restriction for Free Tier users.
 * 2. A 7-column grid representing days of the selected month.
 * 3. Daily ledger entries in each grid cell showing ending balances (Cash, Debit, Credit) 
 *    or expenses based on the Calendar Display Mode configuration.
 * 4. Tapping a day opens a detailed bottom sheet showing transactions on that day, 
 *    allowing users to add new ones, set recurring schedules, or override amounts.
 */

import React, { useState } from 'react';
import type { Transaction, Account, RecurrenceType, TransactionStatus } from '../types';
import { CATEGORIES } from '../types';
import { calculateLedgerForMonth, formatLocalDate, getTransactionOccurrences, calculateAccountBalanceOnDate } from '../utils/finance';

interface CalendarViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (id: string, tx: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  isPro: boolean;
  onTriggerUpgrade: () => void;
  weekStartSunday: boolean; // Settings: Start week on Sun or Mon
  displayMode: 'balance' | 'transactions_paid' | 'transactions_unpaid'; // Settings: what to display in calendar cells
  categories?: Record<string, any>;
  onEditAccount?: (id: string, fields: Partial<Account>) => void;
}



// Helper: Format large numbers to compact values (e.g. 1.2k) to prevent grid overflow on mobile views
const formatCompactVal = (val: number): string => {
  const rounded = Math.round(val);
  const absVal = Math.abs(rounded);
  if (absVal >= 1000000) {
    return `${val < 0 ? '-' : ''}${(absVal / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (absVal >= 1000) {
    return `${val < 0 ? '-' : ''}${(absVal / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${rounded}`;
};

// Helper: Retrieve the season details based on month index (0-11)
const getSeasonInfo = (m: number) => {
  if (m === 11 || m === 0 || m === 1) {
    return { name: 'Winter', icon: '❄️', color: 'hsl(190, 90%, 50%)' };
  }
  if (m === 2 || m === 3 || m === 4) {
    return { name: 'Spring', icon: '🌸', color: 'hsl(142, 72%, 45%)' };
  }
  if (m === 5 || m === 6 || m === 7) {
    return { name: 'Summer', icon: '☀️', color: 'hsl(43, 96%, 56%)' };
  }
  return { name: 'Fall', icon: '🍂', color: 'hsl(350, 89%, 60%)' }; // Sep, Oct, Nov (8, 9, 10)
};

// Holiday decoration vector drawings for each month
const HolidayDecoration: React.FC<{ month: number }> = ({ month }) => {
  switch (month) {
    case 0: // January: Fireworks (New Year's)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="hsl(43, 96%, 56%)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" stroke="hsl(350, 89%, 60%)" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="2.5" fill="#fff"/>
        </svg>
      );
    case 1: // February: Valentine Heart
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="hsl(350, 89%, 60%)"/>
        </svg>
      );
    case 2: // March: Shamrock Clover (St. Patrick's)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <path d="M12 14c0 3 2 5 2 5s-3 .5-4-2c-1 1.5-4 2-4 2s2-2 2-5c-2.5 0-4.5-2-4.5-4S5.5 6 8 6c0-2.5 2-4.5 4-4.5s4 2 4 4.5c2.5 0 4.5 2 4.5 4s-2 4-4.5 4" fill="hsl(142, 72%, 45%)"/>
          <path d="M12 11v8" stroke="hsl(142, 72%, 35%)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      );
    case 3: // April: Easter Egg
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <ellipse cx="12" cy="13" rx="7" ry="9" fill="#c8b6ff"/>
          <path d="M6 13c2-2 4-2 6 0s4 2 6 0" stroke="hsl(43, 96%, 56%)" strokeWidth="2"/>
          <path d="M5 16c2-1 4-1 6 1s4 2 6 0" stroke="#fff" strokeWidth="1.5"/>
        </svg>
      );
    case 4: // May: Flower bloom (Memorial Day)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <circle cx="12" cy="12" r="3" fill="hsl(43, 96%, 56%)"/>
          <circle cx="12" cy="6" r="4" fill="hsl(350, 89%, 60%)" opacity="0.95"/>
          <circle cx="12" cy="18" r="4" fill="hsl(350, 89%, 60%)" opacity="0.95"/>
          <circle cx="6" cy="12" r="4" fill="hsl(350, 89%, 60%)" opacity="0.95"/>
          <circle cx="18" cy="12" r="4" fill="hsl(350, 89%, 60%)" opacity="0.95"/>
        </svg>
      );
    case 5: // June: Summer Sun (Juneteenth)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <circle cx="12" cy="12" r="5.5" fill="hsl(43, 96%, 56%)"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="hsl(43, 96%, 56%)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      );
    case 6: // July: Shield (Independence Day)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <path d="M12 2L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z" fill="#003049"/>
          <path d="M12 6l1.5 3h3.5l-2.5 2 1 3.5-3.5-2-3.5 2 1-3.5-2.5-2h3.5z" fill="hsl(43, 96%, 56%)"/>
        </svg>
      );
    case 7: // August: Sunflower (Harvest)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <circle cx="12" cy="12" r="4.5" fill="#4a2c00"/>
          <path d="M12 2l1.5 4.5h-3zM12 22l1.5-4.5h-3zM2 12l4.5 1.5v-3zM22 12l-4.5 1.5v-3z" fill="hsl(43, 96%, 56%)"/>
          <path d="M5 5l3.5 3.5-1.5-2zM19 19l-3.5-3.5 1.5 2zM5 19l3.5-3.5-1.5 2zM19 5l-3.5 3.5 1.5-2z" fill="hsl(38, 92%, 50%)"/>
        </svg>
      );
    case 8: // September: Fall Leaf (Labor Day)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <path d="M12 2s4 4 4 8c0 3-2 5-4 5s-4-2-4-5c0-4 4-8 4-8z" fill="hsl(38, 92%, 50%)"/>
          <path d="M12 13v8" stroke="#8a2512" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      );
    case 9: // October: Jack-O'-Lantern (Halloween)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <ellipse cx="12" cy="13" rx="8.5" ry="6.5" fill="hsl(38, 92%, 50%)"/>
          <path d="M12 6.5c0-2-1-3-1-3s2 1 2 3" stroke="hsl(142, 72%, 45%)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M8 12l1.5-2L11 12M13 12l1.5-2L16 12" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9.5 15.5c1 1 4 1 5 0" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 10: // November: Turkey (Thanksgiving)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5s2 4.5 4.5 4.5" fill="#a06a50"/>
          <path d="M5 8c0-3 3-5 3-5M19 8c0-3-3-5-3-5" stroke="hsl(38, 92%, 50%)" strokeWidth="2"/>
          <circle cx="12" cy="15" r="4.5" fill="#6f4e37"/>
          <path d="M11.5 15.5l.5 1 .5-1z" fill="hsl(43, 96%, 56%)"/>
        </svg>
      );
    case 11: // December: Christmas Tree
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
          <path d="M12 2l4 5H8l4-5zM12 6l5 6H7l5-6zM12 11l6 7H6l6-7z" fill="hsl(142, 72%, 45%)"/>
          <rect x="11.2" y="18" width="1.6" height="4" fill="#5c3d2e"/>
          <circle cx="12" cy="2.2" r="1" fill="hsl(43, 96%, 56%)"/>
        </svg>
      );
    default:
      return null;
  }
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  accounts,
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  isPro,
  onTriggerUpgrade,
  weekStartSunday,
  displayMode,
  categories,
  onEditAccount,
}) => {
  const activeCategories = categories || CATEGORIES;

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Tapped day state (controls bottom sheet detail)
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Adjust balance modal/inline state (allows manual balance changes per account on any day)
  const [adjustingAccId, setAdjustingAccId] = useState<string | null>(null);
  const [targetBalanceInput, setTargetBalanceInput] = useState<string>('');
  const [adjustNote, setAdjustNote] = useState<string>('');

  // Form States for creating/modifying transactions
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('groceries');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [description, setDescription] = useState('');

  // Editing amount override states (Requirement 5)
  const [editingOccId, setEditingOccId] = useState<string | null>(null);
  const [overrideAmtVal, setOverrideAmtVal] = useState('');

  // 1. FREE TIER MONTH ACCESS LIMITATION RULE:
  // Free users can view all past months, the current month, and the following month.
  // Any month further in the future is locked.
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  // Calculate the following month limit
  let limitYear = todayYear;
  let limitMonth = todayMonth + 1;
  if (limitMonth > 11) {
    limitMonth = 0;
    limitYear += 1;
  }

  // A selected month is locked if it is strictly after the limit month/year
  const isMonthInFarFuture = (year > limitYear) || (year === limitYear && month > limitMonth);
  const isMonthLocked = !isPro && isMonthInFarFuture;

  // Month navigation handlers
  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  // 2. DAILY LEDGER BALANCE GENERATION
  // Compute start/end strings of grid boundaries
  const startOfMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endOfMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
  
  // Get ledger balances for each day of the month
  const monthlyLedger = calculateLedgerForMonth(accounts, transactions, startOfMonthStr, endOfMonthStr);

  // 2b. COMPUTE OVERDRAFT WARNING MAP
  // Only highlight the days in the month if one or more of the accounts are negative
  const getOverdraftHighlightMap = () => {
    const highlightMap: Record<string, boolean> = {};

    for (let d = 1; d <= lastDay; d++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const ledger = monthlyLedger[dayStr];
      if (ledger) {
        // Highlight ONLY if one or more of the accounts are negative on this specific day
        if (ledger.cash < 0 || ledger.debit < 0 || ledger.credit < 0) {
          highlightMap[dayStr] = true;
        }
      }
    }
    return highlightMap;
  };

  const overdraftHighlightMap = getOverdraftHighlightMap();

  // 3. CALENDAR DAY GRID CALCULATIONS
  const firstDayIndex = new Date(year, month, 1).getDay(); // Weekday of 1st day (0 = Sun, 1 = Mon)
  
  // Shift indices depending on Week Start Settings (Sunday vs Monday)
  let blanksCount = firstDayIndex;
  if (!weekStartSunday) {
    blanksCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  }

  const daysInMonth: (string | null)[] = [];
  // Pad previous month blanks
  for (let i = 0; i < blanksCount; i++) {
    daysInMonth.push(null);
  }
  // Fill current month days as date strings (YYYY-MM-DD)
  for (let d = 1; d <= lastDay; d++) {
    daysInMonth.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  // Get weekday headers
  const weekdays = weekStartSunday 
    ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] 
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // 4. DAY OCCURRENCES SELECTION (for selected day panel)
  const getSelectedDayOccurrences = () => {
    if (!selectedDayStr) return [];
    const occurrencesList: { date: string; amount: number; tx: Transaction }[] = [];
    
    transactions.forEach((tx) => {
      // Find occurrences of this transaction on the selected day
      const occs = getTransactionOccurrences(tx, selectedDayStr, selectedDayStr);
      occs.forEach((o) => {
        occurrencesList.push({
          date: o.date,
          amount: o.amount,
          tx: o.transaction
        });
      });
    });
    return occurrencesList;
  };

  const dayOccurrences = getSelectedDayOccurrences();

  // Add transaction handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayStr || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    onAddTransaction({
      accountId,
      amount: Number(amount),
      type,
      category,
      description: description.trim() || activeCategories[category]?.name || 'Transaction',
      date: selectedDayStr,
      recurrence,
      status
    });

    // Reset inputs
    setAmount('');
    setDescription('');
    setIsAddingTx(false);
  };

  // Override specific instance amount handler (Requirement 5)
  const handleSaveOverride = (tx: Transaction, dateStr: string) => {
    if (isNaN(Number(overrideAmtVal)) || Number(overrideAmtVal) <= 0) return;
    
    const existingOverrides = tx.amountOverrides || {};
    const updatedOverrides = {
      ...existingOverrides,
      [dateStr]: Number(overrideAmtVal)
    };

    onEditTransaction(tx.id, {
      amountOverrides: updatedOverrides
    });

    setEditingOccId(null);
    setOverrideAmtVal('');
  };

  // Generate preview text for balance adjustment
  const getAdjustmentPreview = (_acc: Account, currentBal: number, targetVal: number) => {
    const diff = targetVal - currentBal;
    if (Math.abs(diff) < 0.005) {
      return '✓ Balance matches current calculated balance (no adjustment needed).';
    }

    if (diff > 0) {
      return `✓ +$${Math.abs(diff).toFixed(2)} unrecorded funds: will record an Income of $${Math.abs(diff).toFixed(2)} to bring balance to $${targetVal.toFixed(2)}.`;
    } else {
      return `⚠️ -$${Math.abs(diff).toFixed(2)} unrecorded spending: will record an Expense of $${Math.abs(diff).toFixed(2)} to bring balance down to $${targetVal.toFixed(2)}.`;
    }
  };

  // Save manual balance adjustment handler
  const handleSaveBalanceAdjustment = (acc: Account, currentBal: number) => {
    if (!selectedDayStr) return;
    const targetVal = parseFloat(targetBalanceInput);
    if (isNaN(targetVal)) {
      alert('Please enter a valid numeric balance.');
      return;
    }

    const diff = targetVal - currentBal;
    if (Math.abs(diff) < 0.005) {
      setAdjustingAccId(null);
      return;
    }

    let txType: 'income' | 'expense';
    let txCategory: string;
    let defaultDesc: string;

    if (diff > 0) {
      // Balance increased -> unrecorded income
      txType = 'income';
      txCategory = 'income_other';
      defaultDesc = `Balance Adjustment: Unrecorded Income (+$${Math.abs(diff).toFixed(2)})`;
    } else {
      // Balance decreased -> unrecorded expense
      txType = 'expense';
      txCategory = 'expense_other';
      defaultDesc = `Balance Adjustment: Unrecorded Expense (-$${Math.abs(diff).toFixed(2)})`;
    }

    onAddTransaction({
      accountId: acc.id,
      amount: parseFloat(Math.abs(diff).toFixed(2)),
      type: txType,
      category: txCategory,
      description: adjustNote.trim() || defaultDesc,
      date: selectedDayStr,
      recurrence: 'once',
      status: 'paid',
    });

    setAdjustingAccId(null);
    setTargetBalanceInput('');
    setAdjustNote('');
  };

  const seasonInfo = getSeasonInfo(month);

  return (
    <div style={styles.container}>
      {/* Month Selector Bar */}
      <div style={styles.monthHeader}>
        <button style={styles.navBtn} onClick={handlePrevMonth}>◀</button>

        <div style={styles.monthInfoWrapper}>
          <div style={styles.monthTitleRow}>
            <HolidayDecoration month={month} />
            <h2 style={styles.monthTitle}>
              {currentDate.toLocaleDateString('en-US', { month: 'long' })}
            </h2>
            <HolidayDecoration month={month} />
          </div>
          <div style={styles.subHeaderInfo}>
            <span style={styles.yearText}>{year}</span>
            <span style={styles.seasonBadge(seasonInfo.color)}>
              {seasonInfo.icon} {seasonInfo.name}
            </span>
          </div>
        </div>

        <button style={styles.navBtn} onClick={handleNextMonth}>▶</button>
      </div>

      {/* RENDER CALENDAR GRID OR LOCKED SCREEN */}
      {isMonthLocked ? (
        <div className="glass-panel animate-fade-in" style={styles.lockedContainer}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <h3 style={styles.lockedTitle}>Full Calendar Access Locked</h3>
          <p style={styles.lockedText}>
            Free tier allows access to only 2 months at a time. Upgrade to Iron Vault Pro for full access to the entire calendar year!
          </p>
          <button className="btn-primary" onClick={onTriggerUpgrade}>
            Upgrade to Pro for $4.99
          </button>
        </div>
      ) : (
        <div style={styles.calendarArea}>
          {/* Weekday Labels */}
          <div style={styles.weekdayGrid}>
            {weekdays.map((w) => (
              <div key={w} style={styles.weekdayLabel}>{w}</div>
            ))}
          </div>

          {/* Grid Cells */}
          <div style={styles.daysGrid}>
            {daysInMonth.map((dayStr, idx) => {
              if (!dayStr) {
                return <div key={`empty-${idx}`} style={styles.emptyCell} />;
              }

              const dayNum = dayStr.split('-')[2];
              const ledger = monthlyLedger[dayStr] || { cash: 0, debit: 0, credit: 0, dailyExpenses: 0 };
              const isSelected = selectedDayStr === dayStr;
              const isToday = formatLocalDate(new Date()) === dayStr;

              const isWarning = overdraftHighlightMap[dayStr];

              return (
                <div 
                  key={dayStr} 
                  className={isWarning ? 'day-cell-warning' : ''}
                  style={styles.dayCell(isSelected, isToday)}
                  onClick={() => setSelectedDayStr(dayStr)}
                >
                  <span style={styles.dayNumber(isToday)}>{dayNum}</span>
                  
                  {/* Ledger lines by Account type inside cell */}
                  {displayMode === 'balance' && (
                    <div style={styles.ledgerLines}>
                      <span style={styles.ledgerVal('cash')}>🟢${formatCompactVal(ledger.cash)}</span>
                      <span style={styles.ledgerVal('debit')}>🔵${formatCompactVal(ledger.debit)}</span>
                      <span style={styles.ledgerVal('credit')}>🟡${formatCompactVal(ledger.credit)}</span>
                    </div>
                  )}

                  {displayMode === 'transactions_paid' && ledger.dailyExpenses > 0 && (
                    <div style={styles.expenseTag}>💸-${Math.round(ledger.dailyExpenses)}</div>
                  )}

                  {displayMode === 'transactions_unpaid' && (
                    // Renders if there's any unpaid transaction on that day
                    // We calculate it by checking occurrences
                    <div style={styles.unpaidIndicator(ledger.dailyExpenses > 0)}>
                      ⚠️ Unpaid
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SELECTED DAY PANEL - BOTTOM SHEET DETAIL */}
      {selectedDayStr && !isMonthLocked && (
        <div style={styles.bottomSheetOverlay} onClick={() => { setSelectedDayStr(null); setAdjustingAccId(null); }}>
          <div className="glass-panel" style={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHeader}>
              <div>
                <h3 style={styles.sheetTitle}>
                  {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <span style={styles.sheetSub}>Ledger Operations</span>
              </div>
              <button style={styles.closeBtn} onClick={() => { setSelectedDayStr(null); setAdjustingAccId(null); }}>×</button>
            </div>

            {/* ACCOUNT BALANCES ON THIS DAY & MANUAL ADJUSTMENT OPTION */}
            <div style={styles.balancesSection}>
              <div style={styles.balancesSectionHeader}>
                <h4 style={styles.sectionHeading}>Account Balances (End of Day)</h4>
                <span style={styles.balancesTip}>
                  Tap ✏️ to adjust if you forgot an income/expense
                </span>
              </div>

              <div style={styles.accountsBalancesList}>
                {accounts.map((acc) => {
                  const dayBalance = calculateAccountBalanceOnDate(acc, transactions, selectedDayStr);
                  const isAdjusting = adjustingAccId === acc.id;

                  const accColor = acc.type === 'cash' 
                    ? 'var(--income)' 
                    : acc.type === 'credit' 
                    ? 'var(--credit)' 
                    : 'var(--primary)';

                  return (
                    <div key={acc.id} style={styles.accountBalCard}>
                      <div style={styles.accountBalRow}>
                        <div style={styles.accountBalLeft}>
                          <span style={styles.accTypeIcon(acc.type)}>
                            {acc.type === 'cash' ? '💵' : acc.type === 'credit' ? '💳' : '🏦'}
                          </span>
                          <div>
                            <div style={styles.accBalName}>{acc.name}</div>
                            <span style={styles.accTypeBadge(acc.type)}>
                              {acc.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div style={styles.accountBalRight}>
                          <div style={{ ...styles.accBalValue, color: accColor }}>
                            ${dayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <button
                            type="button"
                            style={styles.adjustBalBtn}
                            title={`Adjust ${acc.name} balance`}
                            onClick={() => {
                              if (isAdjusting) {
                                setAdjustingAccId(null);
                              } else {
                                setAdjustingAccId(acc.id);
                                setTargetBalanceInput(dayBalance.toFixed(2));
                                setAdjustNote('');
                              }
                            }}
                          >
                            {isAdjusting ? 'Cancel' : '✏️ Adjust'}
                          </button>
                        </div>
                      </div>

                      {/* EXPANDABLE INLINE ADJUSTMENT PANEL */}
                      {isAdjusting && (
                        <div style={styles.adjustInlinePanel}>
                          <div style={styles.adjustSubHeader}>
                            <span>
                              Reconcile <strong>{acc.name}</strong> on {selectedDayStr}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                              Current: ${dayBalance.toFixed(2)}
                            </span>
                          </div>

                          <div className="input-group" style={{ marginBottom: '8px' }}>
                            <span className="input-label">Actual Balance on this Day ($)</span>
                            <input
                              type="number"
                              step="0.01"
                              value={targetBalanceInput}
                              onChange={(e) => setTargetBalanceInput(e.target.value)}
                              className="form-input"
                              placeholder="0.00"
                              autoFocus
                            />
                          </div>

                          {/* Live Adjustment Calculation & Preview */}
                          {!isNaN(parseFloat(targetBalanceInput)) && (
                            <div style={styles.adjustPreviewBox(parseFloat(targetBalanceInput) >= dayBalance)}>
                              {getAdjustmentPreview(acc, dayBalance, parseFloat(targetBalanceInput))}
                            </div>
                          )}

                          <div className="input-group" style={{ marginBottom: '10px' }}>
                            <span className="input-label">Optional Note / Reason</span>
                            <input
                              type="text"
                              value={adjustNote}
                              onChange={(e) => setAdjustNote(e.target.value)}
                              className="form-input"
                              placeholder="e.g., Unrecorded dinner or forgot cash receipt"
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem' }}
                              onClick={() => handleSaveBalanceAdjustment(acc, dayBalance)}
                            >
                              ✓ Save Balance Adjustment
                            </button>
                            <button
                              type="button"
                              style={styles.cancelInlineBtn}
                              onClick={() => setAdjustingAccId(null)}
                            >
                              Cancel
                            </button>
                          </div>

                          {onEditAccount && (
                            <div style={{ textAlign: 'center', marginTop: '8px' }}>
                              <button
                                type="button"
                                style={styles.linkBtn}
                                onClick={() => {
                                  const val = prompt(`Change initial starting deposit for ${acc.name}:`, acc.initialBalance.toString());
                                  if (val !== null && !isNaN(Number(val)) && Number(val) >= 0) {
                                    onEditAccount(acc.id, { initialBalance: Number(val) });
                                    setAdjustingAccId(null);
                                  }
                                }}
                              >
                                Need to edit account's initial starting deposit instead?
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of current day's transactions */}
            <div style={styles.dayTxList}>
              <h4 style={styles.sectionHeading}>Current Records</h4>
              {dayOccurrences.length === 0 ? (
                <div style={styles.emptyState}>No payments recorded on this day.</div>
              ) : (
                dayOccurrences.map((occ) => {
                  const cat = activeCategories[occ.tx.category];
                  const acc = accounts.find(a => a.id === occ.tx.accountId);
                  const isEditingThis = editingOccId === `${occ.tx.id}-${occ.date}`;

                  return (
                    <div key={`${occ.tx.id}-${occ.date}`} style={styles.txRow}>
                      <div style={styles.txLeft}>
                        <span style={styles.txIcon}>{cat?.icon || '📦'}</span>
                        <div>
                          <div style={styles.txDesc}>{occ.tx.description}</div>
                          <span style={styles.txSubLabel}>
                            {acc?.name} • {occ.tx.recurrence !== 'once' ? `🔄 ${occ.tx.recurrence}` : 'One-time'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={styles.txRight}>
                        {isEditingThis ? (
                          // Amount Override inline editor (Requirement 5)
                          <div style={styles.overrideInputBox}>
                            <input 
                              type="number" 
                              value={overrideAmtVal} 
                              onChange={(e) => setOverrideAmtVal(e.target.value)} 
                              style={styles.overrideInput}
                              autoFocus
                            />
                            <button 
                              onClick={() => handleSaveOverride(occ.tx, occ.date)} 
                              style={styles.overrideSaveBtn}
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => setEditingOccId(null)} 
                              style={styles.overrideCancelBtn}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div style={styles.amountActions}>
                            <span style={styles.txAmount(occ.tx.type === 'income')}>
                              {occ.tx.type === 'income' ? '+' : '-'}${occ.amount.toFixed(2)}
                            </span>
                            
                            {/* Override Amount Trigger Icon */}
                            <button 
                              style={styles.overrideTriggerBtn}
                              title="Override this day's amount"
                              onClick={() => {
                                setEditingOccId(`${occ.tx.id}-${occ.date}`);
                                setOverrideAmtVal(occ.amount.toString());
                              }}
                            >
                              ✏️
                            </button>

                            <button 
                              style={styles.deleteTxBtn} 
                              title="Delete Transaction"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this transaction entirely?')) {
                                  onDeleteTransaction(occ.tx.id);
                                }
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                        <span style={styles.paidStatus(occ.tx.status === 'paid')}>
                          {occ.tx.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ADD TRANSACTION FORM */}
            {!isAddingTx ? (
              <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => setIsAddingTx(true)}>
                + Record Income or Expense
              </button>
            ) : (
              <form onSubmit={handleAddSubmit} style={styles.addForm}>
                <div style={styles.formHeader}>
                  <h4 style={styles.sectionHeading}>Record Flow</h4>
                  <button type="button" style={styles.formCloseLink} onClick={() => setIsAddingTx(false)}>Cancel</button>
                </div>

                {/* Income / Expense Toggle */}
                <div style={styles.toggleRow}>
                  <button 
                    type="button" 
                    style={styles.toggleBtn(type === 'income', true)} 
                    onClick={() => {
                      setType('income');
                      setCategory('salary');
                    }}
                  >
                    Income
                  </button>
                  <button 
                    type="button" 
                    style={styles.toggleBtn(type === 'expense', false)} 
                    onClick={() => {
                      setType('expense');
                      setCategory('groceries');
                    }}
                  >
                    Expense
                  </button>
                </div>

                {/* Amount Input */}
                <div className="input-group">
                  <span className="input-label">Amount ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Account Selection */}
                <div className="input-group">
                  <span className="input-label">Payment Account</span>
                  <select 
                    value={accountId} 
                    onChange={(e) => setAccountId(e.target.value)} 
                    className="form-input"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>

                {/* Category Selection with Text and Icons (Requirements 3 & 4) */}
                <div className="input-group">
                  <span className="input-label">Category</span>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="form-input"
                  >
                    {Object.values(activeCategories)
                      .filter((c: any) => c.type === type)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name} {c.isRecreation ? '(Recreation)' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Recurrence Dropdown Options (Requirement 2) */}
                <div className="input-group">
                  <span className="input-label">Payment Frequency</span>
                  <select 
                    value={recurrence} 
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)} 
                    className="form-input"
                  >
                    <option value="once">One-Time</option>
                    <option value="weekly">Weekly Payments</option>
                    <option value="bi-weekly">Payments every Two Weeks</option>
                    <option value="four-weekly">Payments every Four Weeks</option>
                    <option value="monthly">Monthly Payments</option>
                    <option value="bi-monthly">Payments every Two Months</option>
                    <option value="four-monthly">Payments every Four Months</option>
                    <option value="six-monthly">Payments every Six Months</option>
                    <option value="yearly">Yearly Payments</option>
                  </select>
                </div>

                {/* Description Input */}
                <div className="input-group">
                  <span className="input-label">Description / Note</span>
                  <input
                    type="text"
                    placeholder="e.g., Target grocery haul"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Payment Clearance Status */}
                <div className="input-group">
                  <span className="input-label">Clearance Status</span>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as TransactionStatus)} 
                    className="form-input"
                  >
                    <option value="paid">Paid / Cleared</option>
                    <option value="not paid">Unpaid / Not Paid</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Save Payment Entry
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, any> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
    paddingBottom: '90px',
  },
  monthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  monthTitle: {
    fontFamily: "'UnifrakturMaguntia', serif",
    fontSize: '2rem',
    fontWeight: 400,
    color: 'var(--text-primary)',
    textAlign: 'center',
    margin: '0 8px',
    lineHeight: 1.1,
  },
  monthInfoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  monthTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
  },
  yearText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  seasonBadge: (colorStr: string) => ({
    fontSize: '0.65rem',
    fontWeight: 800,
    color: colorStr,
    backgroundColor: `${colorStr}15`,
    padding: '2px 8px',
    borderRadius: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  }),
  navBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  calendarArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  weekdayGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
    marginBottom: '8px',
  },
  weekdayLabel: {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--text-tertiary)',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridAutoRows: 'minmax(65px, 1fr)',
    gap: '4px',
    backgroundColor: 'var(--border-light)',
    padding: '1px',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  emptyCell: {
    backgroundColor: 'var(--bg-phone)',
  },
  dayCell: (isSelected: boolean, isToday: boolean) => ({
    backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-phone)',
    border: isToday ? '1px solid var(--primary)' : '1px solid transparent',
    padding: '4px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
    minWidth: 0,
  }),
  dayNumber: (isToday: boolean) => ({
    fontSize: '0.8rem',
    fontWeight: 700,
    color: isToday ? 'var(--primary)' : 'var(--text-primary)',
  }),
  ledgerLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '0.55rem',
    fontWeight: 600,
    lineHeight: 1,
  },
  ledgerVal: (type: 'cash' | 'credit' | 'debit') => {
    let color = 'var(--text-secondary)';
    if (type === 'cash') color = 'var(--income)';
    else if (type === 'credit') color = 'var(--credit)';
    else if (type === 'debit') color = 'var(--primary)';
    return {
      color,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  },
  expenseTag: {
    fontSize: '0.55rem',
    fontWeight: 700,
    color: 'var(--expense)',
    textAlign: 'right',
  },
  unpaidIndicator: (hasExpense: boolean) => ({
    fontSize: '0.52rem',
    fontWeight: 700,
    color: 'var(--budget-warning)',
    textAlign: 'right',
    marginTop: hasExpense ? '0' : 'auto',
  }),
  lockedContainer: {
    padding: '40px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    margin: 'auto 0',
  },
  lockedTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1.2rem',
  },
  lockedText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    marginBottom: '8px',
  },
  bottomSheetOverlay: {
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
  bottomSheet: {
    borderRadius: '24px 24px 0 0',
    padding: '24px',
    maxHeight: '80%',
    overflowY: 'auto',
    animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    borderBottom: 'none',
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sheetTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    fontWeight: 700,
  },
  sheetSub: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  dayTxList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeading: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  txRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-light)',
  },
  txLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  txIcon: {
    fontSize: '1.3rem',
  },
  txDesc: {
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  txSubLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
  },
  txRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '3px',
  },
  amountActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  txAmount: (isIncome: boolean) => ({
    fontFamily: 'var(--font-display)',
    fontSize: '0.9rem',
    fontWeight: 750,
    color: isIncome ? 'var(--income)' : 'var(--text-primary)',
  }),
  overrideTriggerBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    fontSize: '0.85rem',
  },
  deleteTxBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    fontSize: '0.85rem',
  },
  paidStatus: (isPaid: boolean) => ({
    fontSize: '0.65rem',
    fontWeight: 700,
    color: isPaid ? 'var(--income)' : 'var(--budget-warning)',
  }),
  emptyState: {
    textAlign: 'center',
    padding: '16px',
    color: 'var(--text-tertiary)',
    fontSize: '0.8rem',
  },
  overrideInputBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  overrideInput: {
    width: '60px',
    padding: '4px',
    border: '1px solid var(--primary)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-phone)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    textAlign: 'right',
  },
  overrideSaveBtn: {
    border: 'none',
    backgroundColor: 'var(--income)',
    color: 'white',
    borderRadius: '4px',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  overrideCancelBtn: {
    border: 'none',
    backgroundColor: 'var(--expense)',
    color: 'white',
    borderRadius: '4px',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  addForm: {
    marginTop: '16px',
    borderTop: '1px solid var(--border-light)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formCloseLink: {
    background: 'none',
    border: 'none',
    color: 'var(--expense)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex',
    backgroundColor: 'var(--bg-input)',
    borderRadius: '10px',
    padding: '2px',
  },
  toggleBtn: (active: boolean, isIncome: boolean) => ({
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.8rem',
    backgroundColor: active ? (isIncome ? 'var(--income)' : 'var(--expense)') : 'transparent',
    color: active ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  }),
  balancesSection: {
    marginBottom: '16px',
    backgroundColor: 'var(--bg-input)',
    borderRadius: '14px',
    padding: '12px',
    border: '1px solid var(--border-light)',
  },
  balancesSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap' as const,
    gap: '4px',
    marginBottom: '8px',
  },
  balancesTip: {
    fontSize: '0.68rem',
    color: 'var(--text-tertiary)',
  },
  accountsBalancesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  accountBalCard: {
    borderRadius: '10px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-card)',
    overflow: 'hidden',
  },
  accountBalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
  },
  accountBalLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  accTypeIcon: (_type: string) => ({
    fontSize: '1.1rem',
    lineHeight: 1,
  }),
  accBalName: {
    fontWeight: 700,
    fontSize: '0.78rem',
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  accTypeBadge: (type: string) => {
    let color = 'var(--primary)';
    let bg = 'hsla(208, 100%, 50%, 0.12)';
    if (type === 'cash') {
      color = 'var(--income)';
      bg = 'hsla(142, 72%, 45%, 0.12)';
    } else if (type === 'credit') {
      color = 'var(--credit)';
      bg = 'hsla(43, 96%, 56%, 0.15)';
    }
    return {
      fontSize: '0.6rem',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      padding: '1px 5px',
      borderRadius: '4px',
      color,
      backgroundColor: bg,
      display: 'inline-block',
      marginTop: '2px',
    };
  },
  accountBalRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  accBalValue: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  adjustBalBtn: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: 700,
    backgroundColor: 'hsla(208, 100%, 50%, 0.12)',
    color: 'var(--primary)',
    border: '1px solid hsla(208, 100%, 50%, 0.3)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  adjustInlinePanel: {
    padding: '10px 12px',
    borderTop: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
  },
  adjustSubHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.74rem',
    marginBottom: '8px',
    color: 'var(--text-secondary)',
  },
  adjustPreviewBox: (isPositive: boolean) => ({
    backgroundColor: isPositive ? 'rgba(20, 180, 90, 0.1)' : 'rgba(220, 50, 80, 0.1)',
    border: `1px solid ${isPositive ? 'rgba(20, 180, 90, 0.25)' : 'rgba(220, 50, 80, 0.25)'}`,
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '0.72rem',
    color: isPositive ? 'var(--income)' : 'var(--expense)',
    marginBottom: '8px',
    lineHeight: 1.3,
  }),
  cancelInlineBtn: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    background: 'none',
    border: '1px solid var(--border-light)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '0.68rem',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: '2px',
  }
};
