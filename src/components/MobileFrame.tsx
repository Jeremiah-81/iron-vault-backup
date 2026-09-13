import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, theme, setTheme }) => {
  // Get current system-style time for the top status bar
  const [time, setTime] = React.useState('10:02');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-viewport">
      {/* Phone Status Bar (Mocked for premium feel) */}
      <div style={styles.statusBar}>
        <span style={styles.time}>{time}</span>
        
        {/* Notch */}
        <div style={styles.notch} />

        <div style={styles.statusIcons}>
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={styles.themeBtn}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
          </button>
          
          {/* Signal Strength */}
          <svg width="16" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="16" width="3" height="5" rx="0.5" />
            <rect x="7" y="12" width="3" height="9" rx="0.5" />
            <rect x="12" y="8" width="3" height="13" rx="0.5" />
            <rect x="17" y="3" width="3" height="18" rx="0.5" />
          </svg>
          
          {/* Battery */}
          <div style={styles.batteryContainer}>
            <div style={styles.batteryBody}>
              <div style={styles.batteryLevel} />
            </div>
            <div style={styles.batteryTip} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={styles.content}>
        {children}
      </div>

      {/* Home Indicator line (bottom of phone bezel) */}
      <div style={styles.homeIndicatorContainer}>
        <div style={styles.homeIndicator} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  statusBar: {
    height: '44px',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-phone)',
    borderBottom: '1px solid var(--border-light)',
    userSelect: 'none',
    zIndex: 100,
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '-0.2px',
    color: 'var(--text-primary)',
  },
  time: {
    width: '75px',
  },
  notch: {
    width: '110px',
    height: '22px',
    backgroundColor: 'hsl(222, 28%, 18%)',
    borderRadius: '0 0 16px 16px',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    top: 0,
  },
  statusIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '75px',
    justifyContent: 'flex-end',
  },
  themeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '50%',
    transition: 'color 0.2s',
  },
  batteryContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  batteryBody: {
    width: '20px',
    height: '11px',
    border: '1.5px solid currentColor',
    borderRadius: '3px',
    padding: '1px',
    display: 'flex',
  },
  batteryLevel: {
    height: '100%',
    width: '80%',
    backgroundColor: 'currentColor',
    borderRadius: '1px',
  },
  batteryTip: {
    width: '1.5px',
    height: '4px',
    backgroundColor: 'currentColor',
    borderRadius: '0 1px 1px 0',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: 'var(--bg-phone)',
  },
  homeIndicatorContainer: {
    height: '16px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'var(--bg-phone)',
    paddingBottom: '4px',
  },
  homeIndicator: {
    width: '120px',
    height: '5px',
    backgroundColor: 'var(--text-tertiary)',
    borderRadius: '10px',
    opacity: 0.5,
  },
};
