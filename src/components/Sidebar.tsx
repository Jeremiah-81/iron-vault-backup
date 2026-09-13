/**
 * SIDEBAR DRAWER NAVIGATION COMPONENT
 * Renders the sliding side menu that opens from the left side of the viewport.
 * Provides navigation buttons for all primary features, a settings accordion,
 * and a direct link to the Pro upgrade screen.
 */

import React, { useState } from 'react';

// Defines the available primary sections in the Iron Vault app
export type ActiveScreen =
  | 'calendar'
  | 'payments'
  | 'accounts'
  | 'balance'
  | 'income_expense'
  | 'stats'
  | 'settings'
  | 'help'
  | 'purchase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  isPro: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeScreen,
  onNavigate,
  isPro
}) => {
  // Local state to toggle the dropdown menus for Settings inside the sidebar
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Helper to handle main navigation and automatically close the sidebar
  const handleNav = (screen: ActiveScreen) => {
    onNavigate(screen);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      {/* Drawer Panel Container */}
      <div 
        style={styles.drawer} 
        onClick={(e) => e.stopPropagation()} // Prevents clicking inside sidebar from closing it
        className="animate-slide-in"
      >
        {/* Sidebar Header Brand (Iron Vault) */}
        <div style={styles.brandContainer}>
          <div style={styles.logoCircle}>🛡️</div>
          <div>
            <h1 style={styles.brandTitle}>IRON VAULT</h1>
            <span style={styles.proBadge(isPro)}>
              {isPro ? 'PRO LICENSE' : 'FREE TIER (2-MONTHS)'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div style={styles.navList}>
          {/* Calendar Screen button */}
          <button 
            style={styles.navButton(activeScreen === 'calendar')} 
            onClick={() => handleNav('calendar')}
          >
            <span style={styles.navIcon}>📅</span>
            <span style={styles.navText}>Calendar</span>
          </button>

          {/* Payments Screen button */}
          <button 
            style={styles.navButton(activeScreen === 'payments')} 
            onClick={() => handleNav('payments')}
          >
            <span style={styles.navIcon}>💳</span>
            <span style={styles.navText}>Payments Feed</span>
          </button>

          {/* Accounts Screen button */}
          <button 
            style={styles.navButton(activeScreen === 'accounts')} 
            onClick={() => handleNav('accounts')}
          >
            <span style={styles.navIcon}>💼</span>
            <span style={styles.navText}>Accounts</span>
          </button>

          {/* Balance History Chart Button */}
          <button 
            style={styles.navButton(activeScreen === 'balance')} 
            onClick={() => handleNav('balance')}
          >
            <span style={styles.navIcon}>📈</span>
            <span style={styles.navText}>Balance Tracker</span>
          </button>

          {/* Income & Expense Chart Button */}
          <button 
            style={styles.navButton(activeScreen === 'income_expense')} 
            onClick={() => handleNav('income_expense')}
          >
            <span style={styles.navIcon}>📊</span>
            <span style={styles.navText}>Income & Expenses</span>
          </button>

          {/* Stats Screen Button */}
          <button 
            style={styles.navButton(activeScreen === 'stats')} 
            onClick={() => handleNav('stats')}
          >
            <span style={styles.navIcon}>📝</span>
            <span style={styles.navText}>Statistics</span>
          </button>

          {/* Settings Section with accordion list */}
          <div>
            <button 
              style={styles.navButton(activeScreen === 'settings')} 
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                onNavigate('settings');
              }}
            >
              <span style={styles.navIcon}>⚙️</span>
              <span style={styles.navText}>Settings</span>
              <span style={styles.arrowIcon}>{isSettingsOpen ? '▼' : '▶'}</span>
            </button>
            
            {/* Nested Sub-options for settings dropdown */}
            {isSettingsOpen && (
              <div style={styles.submenu}>
                <div style={styles.submenuItem} onClick={() => handleNav('settings')}>🔔 Notifications</div>
                <div style={styles.submenuItem} onClick={() => handleNav('settings')}>☁️ Cloud Sync</div>
                <div style={styles.submenuItem} onClick={() => handleNav('settings')}>🗓️ Calendar Mode</div>
                <div style={styles.submenuItem} onClick={() => handleNav('settings')}>🔒 Passcode Lock</div>
                <div style={styles.submenuItem} onClick={() => handleNav('settings')}>💾 Data & Reset</div>
                <div style={styles.submenuItem} onClick={() => handleNav('settings')}>ℹ️ About Vault</div>
              </div>
            )}
          </div>

          <div style={styles.divider} />

          {/* Help & Feedback Button */}
          <button 
            style={styles.navButton(activeScreen === 'help')} 
            onClick={() => handleNav('help')}
          >
            <span style={styles.navIcon}>📧</span>
            <span style={styles.navText}>Help & Feedback</span>
          </button>

          {/* Upgrade to Pro Button */}
          {!isPro && (
            <button 
              style={styles.upgradeBtn} 
              onClick={() => handleNav('purchase')}
            >
              <span style={styles.upgradeIcon}>💎</span>
              <div style={{ textAlign: 'left' }}>
                <div style={styles.upgradeTextMain}>Purchase Pro</div>
                <div style={styles.upgradeTextSub}>Unlock Full Calendar year</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 300,
  },
  drawer: {
    width: '280px',
    height: '100%',
    backgroundColor: 'var(--bg-phone)',
    borderRight: '1px solid var(--border-light)',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-light)',
  },
  logoCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, hsl(45, 90%, 55%) 0%, hsl(20, 85%, 45%) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    boxShadow: '0 4px 10px rgba(220,140,20,0.3)',
  },
  brandTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '1px',
    color: 'var(--text-primary)',
  },
  proBadge: (isPro: boolean) => ({
    display: 'inline-block',
    fontSize: '0.62rem',
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '3px',
    background: isPro ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'var(--bg-card)',
    color: isPro ? '#000' : 'var(--text-secondary)',
    letterSpacing: '0.5px',
  }),
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    overflowY: 'auto',
  },
  navButton: (isActive: boolean) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: isActive ? 'var(--primary-glow)' : 'transparent',
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  }),
  navIcon: {
    fontSize: '1.15rem',
    marginRight: '12px',
    width: '24px',
    display: 'inline-block',
  },
  navText: {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.88rem',
    flex: 1,
  },
  arrowIcon: {
    fontSize: '0.65rem',
    opacity: 0.6,
  },
  submenu: {
    paddingLeft: '36px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    margin: '4px 0 8px 0',
  },
  submenuItem: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text-primary)',
    }
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-light)',
    margin: '8px 0',
  },
  upgradeBtn: {
    marginTop: 'auto',
    width: '100%',
    background: 'linear-gradient(135deg, hsl(208, 100%, 65%) 0%, hsl(265, 85%, 60%) 100%)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 8px 20px rgba(100, 50, 200, 0.3)',
    transition: 'transform 0.2s',
  },
  upgradeIcon: {
    fontSize: '1.4rem',
  },
  upgradeTextMain: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  upgradeTextSub: {
    fontSize: '0.68rem',
    opacity: 0.85,
  }
};
