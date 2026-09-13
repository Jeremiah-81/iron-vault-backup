/**
 * STATISTICS AND CHARTS VIEWS FOR IRON VAULT
 * 
 * This file consolidates three major screens:
 * 1. BalanceTrackerView: Interactive line chart of cash/credit/debit balances over time.
 * 2. IncomeExpenseGraphView: Vertical bar chart comparing income (green) vs expenses (red) per account.
 * 3. StatsTabsView: Tabs for:
 *    - Averages (overall, monthly, weekly totals).
 *    - Periodic (recurring lists).
 *    - Once (one-time transactions list).
 */

import React, { useState } from 'react';
import type { Transaction, Account, AccountType } from '../types';
import { CATEGORIES } from '../types';
import { getTransactionOccurrences, parseLocalDate, formatLocalDate } from '../utils/finance';

// ============================================================================
// 1. BALANCE TRACKER VIEW (LINE CHART)
// ============================================================================
interface BalanceTrackerProps {
  accounts: Account[];
  transactions: Transaction[];
}

export const BalanceTrackerView: React.FC<BalanceTrackerProps> = ({ accounts, transactions }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // We will generate balance points for the last 6 weeks (42 days) to show history
  const generateHistoryPoints = () => {
    const points: { label: string; dateStr: string; cash: number; credit: number; debit: number }[] = [];
    const today = new Date();
    
    // Create 6 weekly check points
    for (let i = 5; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i * 7);
      const dateStr = formatLocalDate(checkDate);
      
      // Initialize balances with each account's starting values
      const balances = {
        cash: accounts.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.initialBalance, 0),
        debit: accounts.filter(a => a.type === 'debit').reduce((sum, a) => sum + a.initialBalance, 0),
        credit: accounts.filter(a => a.type === 'credit').reduce((sum, a) => sum + a.initialBalance, 0)
      };

      transactions.forEach((tx) => {
        const acc = accounts.find(a => a.id === tx.accountId);
        if (!acc) return;
        const occs = getTransactionOccurrences(tx, '2020-01-01', dateStr);
        occs.forEach((o) => {
          if (tx.type === 'income') {
            balances[acc.type] += o.amount;
          } else {
            balances[acc.type] -= o.amount;
          }
        });
      });

      points.push({
        label: `Wk-${5-i}`,
        dateStr,
        ...balances
      });
    }
    return points;
  };

  const historyPoints = generateHistoryPoints();

  // Find max value to scale the chart points properly
  const findMaxVal = () => {
    let max = 1000;
    historyPoints.forEach(p => {
      const vals = [p.cash, p.debit, p.credit];
      max = Math.max(max, ...vals);
    });
    return max * 1.1; // 10% headroom
  };

  const maxVal = findMaxVal();

  // SVG parameters
  const width = 320;
  const height = 180;
  const padX = 35;
  const padY = 20;
  const chartW = width - 2 * padX;
  const chartH = height - 2 * padY;

  // Generate SVG coordinates for a specific account type
  const getCoordinates = (type: AccountType) => {
    return historyPoints.map((p, idx) => {
      const val = p[type];
      const x = padX + (idx / (historyPoints.length - 1)) * chartW;
      const y = padY + chartH - (val / maxVal) * chartH;
      return { x, y };
    });
  };

  const cashCoords = getCoordinates('cash');
  const debitCoords = getCoordinates('debit');
  const creditCoords = getCoordinates('credit');

  const getPathString = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    return coords.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, '');
  };

  // Determine which accounts to draw based on user filters
  const selectedAcc = accounts.find(a => a.id === selectedAccountId);

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>Balance Tracker</h2>
          <span style={styles.subtitle}>Net worth growth chart</span>
        </div>

        {/* Account Filter dropdown */}
        <select 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="form-input"
          style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
        >
          <option value="all">All Accounts Combined</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* SVG LINE CHART CARD */}
      <div className="glass-panel" style={styles.chartCard}>
        <div style={styles.legend}>
          {(!selectedAcc || selectedAcc.type === 'cash') && (
            <div style={styles.legendItem}><span style={styles.dot('#142, 72%, 45%')} /> Cash (Green)</div>
          )}
          {(!selectedAcc || selectedAcc.type === 'debit') && (
            <div style={styles.legendItem}><span style={styles.dot('#190, 90%, 50%')} /> Debit (Blue)</div>
          )}
          {(!selectedAcc || selectedAcc.type === 'credit') && (
            <div style={styles.legendItem}><span style={styles.dot('var(--credit)')} /> Credit (Gold)</div>
          )}
        </div>

        <div style={styles.svgWrapper}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1={padX} y1={padY + chartH / 2} x2={width - padX} y2={padY + chartH / 2} stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1={padX} y1={padY + chartH} x2={width - padX} y2={padY + chartH} stroke="var(--border-light)" />

            {/* Line Drawings */}
            {(!selectedAcc || selectedAcc.type === 'cash') && (
              <path d={getPathString(cashCoords)} fill="none" stroke="hsl(142, 72%, 45%)" strokeWidth="2.5" />
            )}
            {(!selectedAcc || selectedAcc.type === 'debit') && (
              <path d={getPathString(debitCoords)} fill="none" stroke="hsl(190, 90%, 50%)" strokeWidth="2.5" />
            )}
            {(!selectedAcc || selectedAcc.type === 'credit') && (
              <path d={getPathString(creditCoords)} fill="none" stroke="var(--credit)" strokeWidth="2.5" strokeDasharray="2" />
            )}

            {/* Labels and values */}
            {historyPoints.map((p, i) => {
              const x = padX + (i / (historyPoints.length - 1)) * chartW;
              return (
                <text key={i} x={x} y={height - 2} fill="var(--text-tertiary)" fontSize="8" textAnchor="middle">
                  {p.label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Account Balance Summaries List */}
      <div style={styles.list}>
        {accounts.filter(a => selectedAccountId === 'all' || a.id === selectedAccountId).map(a => {
          let running = a.initialBalance;
          transactions.forEach((tx) => {
            if (tx.accountId !== a.id) return;
            const occs = getTransactionOccurrences(tx, '2020-01-01', formatLocalDate(new Date()));
            occs.forEach((o) => {
              if (tx.type === 'income') running += o.amount;
              else running -= o.amount;
            });
          });

          return (
            <div key={a.id} className="glass-panel" style={styles.smallRow}>
              <span>{a.name} ({a.type})</span>
              <span style={{ fontWeight: 'bold' }}>${running.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ============================================================================
// 2. INCOME & EXPENSES VIEW (VERTICAL BAR GRAPH)
// ============================================================================
interface IncomeExpenseProps {
  accounts: Account[];
  transactions: Transaction[];
}

export const IncomeExpenseGraphView: React.FC<IncomeExpenseProps> = ({ accounts, transactions }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  // Generate monthly values for this selected account specifically
  // Separated so each account has its own graph and page view.
  const getGraphData = () => {
    // Look at W1 to W5 of current month
    const weeks = [
      { name: 'W1', income: 0, expense: 0 },
      { name: 'W2', income: 0, expense: 0 },
      { name: 'W3', income: 0, expense: 0 },
      { name: 'W4', income: 0, expense: 0 },
      { name: 'W5', income: 0, expense: 0 }
    ];

    transactions.forEach((tx) => {
      if (tx.accountId !== selectedAccountId) return;
      const occurrences = getTransactionOccurrences(tx, '2026-07-01', '2026-07-31');
      occurrences.forEach((occ) => {
        const day = parseLocalDate(occ.date).getDate();
        let idx = 4;
        if (day <= 7) idx = 0;
        else if (day <= 14) idx = 1;
        else if (day <= 21) idx = 2;
        else if (day <= 28) idx = 3;

        if (tx.type === 'income') {
          weeks[idx].income += occ.amount;
        } else {
          weeks[idx].expense += occ.amount;
        }
      });
    });

    return weeks;
  };

  const graphData = getGraphData();
  const maxBarVal = Math.max(...graphData.map(d => Math.max(d.income, d.expense)), 500);

  const chartHeight = 120;

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>Income & Expenses</h2>
          <span style={styles.subtitle}>Flow bar analysis</span>
        </div>

        {/* Selected Account Selector */}
        <select 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="form-input"
          style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* BAR CHART SECTION */}
      <div className="glass-panel" style={styles.chartCard}>
        <div style={styles.legend}>
          <div style={styles.legendItem}><span style={styles.dot('var(--income)')} /> Income (Green)</div>
          <div style={styles.legendItem}><span style={styles.dot('var(--expense)')} /> Expenses (Red)</div>
        </div>

        {/* Bar layout grid */}
        <div style={styles.barChartContainer}>
          {graphData.map((d) => {
            const incomeHeight = (d.income / maxBarVal) * chartHeight;
            const expenseHeight = (d.expense / maxBarVal) * chartHeight;

            return (
              <div key={d.name} style={styles.barColumn}>
                <div style={styles.barsRow}>
                  {/* Income Bar (Green) */}
                  <div style={styles.barOuter}>
                    <div 
                      style={{ 
                        ...styles.barFillGreen, 
                        height: `${incomeHeight}px`,
                        boxShadow: '0 0 8px var(--income-glow)' 
                      }} 
                    />
                  </div>
                  {/* Expense Bar (Red) */}
                  <div style={styles.barOuter}>
                    <div 
                      style={{ 
                        ...styles.barFillRed, 
                        height: `${expenseHeight}px`,
                        boxShadow: '0 0 8px var(--expense-glow)' 
                      }} 
                    />
                  </div>
                </div>
                <span style={styles.barLabel}>{d.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aggregate numbers for Selected Account */}
      <div style={styles.list}>
        {graphData.map((d) => (
          <div key={d.name} className="glass-panel" style={styles.breakdownRow}>
            <span style={{ fontWeight: 'bold' }}>{d.name} Summary</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ color: 'var(--income)' }}>+${d.income}</span>
              <span style={{ color: 'var(--expense)' }}>-${d.expense}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ============================================================================
// 3. STATS TABS VIEW (STATS, PERIODIC, ONCE)
// ============================================================================
interface StatsTabsProps {
  accounts: Account[];
  transactions: Transaction[];
}

export const StatsTabsView: React.FC<StatsTabsProps> = ({ accounts, transactions }) => {
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'periodic' | 'once'>('stats');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Filter transactions for specific account
  const accountTransactions = transactions.filter((tx) => selectedAccountId === 'all' || tx.accountId === selectedAccountId);

  // Tab 1 Calculations: Averages
  const getStatsAverages = () => {
    let totalInc = 0;
    let totalExp = 0;
    
    // Look back window (from 2026-07-01 to 2026-07-31)
    accountTransactions.forEach((tx) => {
      const occurrences = getTransactionOccurrences(tx, '2026-07-01', '2026-07-31');
      occurrences.forEach((occ) => {
        if (tx.type === 'income') totalInc += occ.amount;
        else totalExp += occ.amount;
      });
    });

    const overallTotal = totalInc - totalExp;
    const monthlyAverage = totalInc - totalExp; // Using 1 month window
    const weeklyAverage = (totalInc - totalExp) / 4.3; // 4.3 weeks in a month

    return { totalInc, totalExp, overallTotal, monthlyAverage, weeklyAverage };
  };

  const averages = getStatsAverages();

  // Tab 2 Filter: Recurring transactions
  const periodicTransactions = accountTransactions.filter(tx => tx.recurrence !== 'once');

  // Tab 3 Filter: One-time payments
  const onceTransactions = accountTransactions.filter(tx => tx.recurrence === 'once');

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>Statistics</h2>
          <span style={styles.subtitle}>Audit records averages</span>
        </div>

        {/* Account Selector */}
        <select 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="form-input"
          style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
        >
          <option value="all">All Accounts</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* SUB TAB CONTROLS */}
      <div style={styles.subTabRow}>
        <button 
          style={styles.subTabButton(activeSubTab === 'stats')} 
          onClick={() => setActiveSubTab('stats')}
        >
          Averages
        </button>
        <button 
          style={styles.subTabButton(activeSubTab === 'periodic')} 
          onClick={() => setActiveSubTab('periodic')}
        >
          Periodic
        </button>
        <button 
          style={styles.subTabButton(activeSubTab === 'once')} 
          onClick={() => setActiveSubTab('once')}
        >
          Once
        </button>
      </div>

      {/* TAB 1 CONTENT: AVERAGES */}
      {activeSubTab === 'stats' && (
        <div style={styles.tabContent} className="animate-fade-in">
          <div className="glass-panel" style={styles.statsCardGrid}>
            <div style={styles.statMetric}>
              <span style={styles.metricLabel}>Total Income</span>
              <div style={{ ...styles.metricValueText, color: 'var(--income)' }}>
                +${averages.totalInc.toLocaleString()}
              </div>
            </div>
            
            <div style={styles.statMetric}>
              <span style={styles.metricLabel}>Total Expense</span>
              <div style={{ ...styles.metricValueText, color: 'var(--expense)' }}>
                -${averages.totalExp.toLocaleString()}
              </div>
            </div>

            <div style={styles.statMetric}>
              <span style={styles.metricLabel}>Net Saving Balance</span>
              <div style={{ ...styles.metricValueText, color: averages.overallTotal >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                ${averages.overallTotal.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="glass-panel animate-fade-in-up" style={styles.statCard}>
            <h4 style={styles.cardHeaderTitle}>Averages Breakdown</h4>
            <div style={styles.avgRow}>
              <span>Weekly Average savings:</span>
              <span style={{ fontWeight: 'bold' }}>${averages.weeklyAverage.toFixed(2)}</span>
            </div>
            <div style={styles.avgRow}>
              <span>Monthly Average savings:</span>
              <span style={{ fontWeight: 'bold' }}>${averages.monthlyAverage.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 CONTENT: PERIODIC RECURRING */}
      {activeSubTab === 'periodic' && (
        <div style={styles.tabContent} className="animate-fade-in">
          {periodicTransactions.length === 0 ? (
            <div style={styles.emptyState}>No recurring payments scheduled.</div>
          ) : (
            <div style={styles.list}>
              {periodicTransactions.map((tx) => {
                const cat = CATEGORIES[tx.category];
                return (
                  <div key={tx.id} className="glass-panel" style={styles.recurringItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{cat?.icon || '🔄'}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>{tx.description}</div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          Repeats {tx.recurrence}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 'bold', color: tx.type === 'income' ? 'var(--income)' : 'var(--text-primary)' }}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3 CONTENT: ONE TIME PAYMENTS */}
      {activeSubTab === 'once' && (
        <div style={styles.tabContent} className="animate-fade-in">
          {onceTransactions.length === 0 ? (
            <div style={styles.emptyState}>No one-time transactions found.</div>
          ) : (
            <div style={styles.list}>
              {onceTransactions.map((tx) => {
                const cat = CATEGORIES[tx.category];
                return (
                  <div key={tx.id} className="glass-panel" style={styles.recurringItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{cat?.icon || '📦'}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>{tx.description}</div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          {tx.date}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 'bold', color: tx.type === 'income' ? 'var(--income)' : 'var(--text-primary)' }}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
  chartCard: {
    padding: '16px',
    borderRadius: '16px',
  },
  legend: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  legendItem: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  dot: (colorStr: string) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: colorStr.startsWith('var(') || colorStr.startsWith('#') ? colorStr : `hsl(${colorStr})`,
  }),
  svgWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  smallRow: {
    padding: '12px 16px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  breakdownRow: {
    padding: '10px 14px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
  },
  barChartContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '150px',
    padding: '10px 0',
  },
  barColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  barsRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '3px',
  },
  barOuter: {
    width: '12px',
    height: '120px',
    backgroundColor: 'var(--bg-input)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  barFillGreen: {
    width: '100%',
    backgroundColor: 'var(--income)',
    borderRadius: '6px',
    transition: 'height 0.3s ease',
  },
  barFillRed: {
    width: '100%',
    backgroundColor: 'var(--expense)',
    borderRadius: '6px',
    transition: 'height 0.3s ease',
  },
  barLabel: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'var(--text-secondary)',
  },
  subTabRow: {
    display: 'flex',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
  },
  subTabButton: (active: boolean) => ({
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.8rem',
    backgroundColor: active ? 'var(--primary)' : 'transparent',
    color: active ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  }),
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statsCardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    padding: '14px',
    borderRadius: '16px',
  },
  statMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '0.62rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
  },
  metricValueText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.88rem',
    fontWeight: 800,
  },
  statCard: {
    padding: '16px',
    borderRadius: '16px',
  },
  cardHeaderTitle: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  avgRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    padding: '6px 0',
    borderBottom: '1px solid var(--border-light)',
  },
  recurringItem: {
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px 0',
    color: 'var(--text-tertiary)',
    fontSize: '0.82rem',
  }
};
