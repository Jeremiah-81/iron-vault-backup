/**
 * SETTINGS, HELP, AND PRO CHECKOUT VIEWS FOR IRON VAULT
 * 
 * This file gathers:
 * 1. SettingsView: Accordion listing for Notifications, Cloud Sync, Week Start, Passcode locks, Data resets, and Version info.
 *    Restricts premium items (Notifications, Cloud Sync, Password locks) for Free tier users.
 * 2. HelpFeedbackView: Support contact panel.
 * 3. PurchaseProView: Sleek checkout portal showing value adds of Iron Vault Pro ($4.99).
 */

import React, { useState } from 'react';
import type { CategoryInfo } from '../types';
import { CATEGORIES } from '../types';

// ============================================================================
// 1. SETTINGS VIEW COMPONENT
// ============================================================================
interface SettingsViewProps {
  isPro: boolean;
  onTriggerUpgrade: () => void;
  weekStartSunday: boolean;
  setWeekStartSunday: (val: boolean) => void;
  displayMode: 'balance' | 'transactions_paid' | 'transactions_unpaid';
  setDisplayMode: (val: 'balance' | 'transactions_paid' | 'transactions_unpaid') => void;
  onClearAllData: () => void;
  categories?: Record<string, CategoryInfo>;
  onUpdateCategory?: (id: string, updatedFields: Partial<CategoryInfo>) => void;
  onAddCategory?: (newCat: CategoryInfo) => void;
  onDeleteCategory?: (id: string) => void;
  onResetCategories?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isPro,
  onTriggerUpgrade,
  weekStartSunday,
  setWeekStartSunday,
  displayMode,
  setDisplayMode,
  onClearAllData,
  categories,
  onUpdateCategory,
  onAddCategory,
  onDeleteCategory,
  onResetCategories
}) => {
  // Accordion active index (0 = Notifications, 1 = Cloud Sync, etc.)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Forms helper states
  const [email, setEmail] = useState('user@ironvault.com');
  const [pass, setPass] = useState('********');
  const [passcode, setPasscode] = useState('1234');
  const [useFingerprint, setUseFingerprint] = useState(false);
  const [notifyTime, setNotifyTime] = useState('09:00');
  const [soundType, setSoundType] = useState('alarm');

  // Category Editor states
  const activeCategories = categories || CATEGORIES;
  const [catTab, setCatTab] = useState<'all' | 'income' | 'expense'>('all');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatIcon, setEditingCatIcon] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newCatIsRecreation, setNewCatIsRecreation] = useState(false);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  // Lock helper to block click triggers for free tier users
  const handlePremiumInteraction = () => {
    if (!isPro) {
      onTriggerUpgrade();
    }
  };

  const handleStartEdit = (cat: CategoryInfo) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
    setEditingCatIcon(cat.icon);
  };

  const handleSaveEdit = (catId: string) => {
    if (onUpdateCategory && editingCatName.trim()) {
      onUpdateCategory(catId, {
        name: editingCatName.trim(),
        icon: editingCatIcon.trim() || '🏷️'
      });
    }
    setEditingCatId(null);
  };

  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !onAddCategory) return;
    const cleanId = 'cat_' + Date.now();
    onAddCategory({
      id: cleanId,
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '🏷️',
      type: newCatType,
      isRecreation: newCatType === 'expense' && newCatIsRecreation
    });
    setNewCatName('');
    setShowAddCat(false);
  };

  const handleClearConfirm = () => {
    if (confirm('CRITICAL ACTION: Are you sure you want to permanently delete all accounts, transactions, and custom data? All accounts will be reset to zero ($0.00). Proceed?')) {
      onClearAllData();
    }
  };

  const filteredCategories = Object.values(activeCategories).filter((c) => {
    if (catTab === 'all') return true;
    return c.type === catTab;
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      <div>
        <h2 style={styles.pageTitle}>Settings</h2>
        <span style={styles.subtitle}>Customize your vault credentials & storage</span>
      </div>

      {/* ACCORDION ITEMS CONTAINER */}
      <div style={styles.accordionList}>
        
        {/* OPTION 1: NOTIFICATIONS (PREMIUM) */}
        <div className="glass-panel" style={styles.accCard}>
          <div style={styles.accHeader} onClick={() => toggleAccordion(0)}>
            <span>🔔 Notifications {!isPro && '💎'}</span>
            <span>{openIndex === 0 ? '▲' : '▼'}</span>
          </div>
          {openIndex === 0 && (
            <div style={styles.accContent(isPro)} onClick={handlePremiumInteraction}>
              <p style={styles.lockText(!isPro)}>
                🔒 Set reminders for recurring bills and income events. (Upgrade to Pro required)
              </p>
              <div className="input-group">
                <span className="input-label">Remind Me At</span>
                <input 
                  type="time" 
                  value={notifyTime} 
                  onChange={(e) => setNotifyTime(e.target.value)} 
                  disabled={!isPro}
                  className="form-input" 
                />
              </div>
              <div className="input-group">
                <span className="input-label">Reminder Tone</span>
                <select 
                  value={soundType} 
                  onChange={(e) => setSoundType(e.target.value)} 
                  disabled={!isPro}
                  className="form-input" 
                >
                  <option value="alarm">Default Alarm Buzzer</option>
                  <option value="song">Song from Device Storage</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* OPTION 2: CLOUD SYNC (PREMIUM) */}
        <div className="glass-panel" style={styles.accCard}>
          <div style={styles.accHeader} onClick={() => toggleAccordion(1)}>
            <span>☁️ Cloud Sync {!isPro && '💎'}</span>
            <span>{openIndex === 1 ? '▲' : '▼'}</span>
          </div>
          {openIndex === 1 && (
            <div style={styles.accContent(isPro)} onClick={handlePremiumInteraction}>
              <p style={styles.lockText(!isPro)}>
                🔒 Secure and sync your accounts database between devices. (Upgrade to Pro required)
              </p>
              <div className="input-group">
                <span className="input-label">Sync Email</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={!isPro}
                  className="form-input" 
                />
              </div>
              <div className="input-group">
                <span className="input-label">Credentials Password</span>
                <input 
                  type="password" 
                  value={pass} 
                  onChange={(e) => setPass(e.target.value)} 
                  disabled={!isPro}
                  className="form-input" 
                />
              </div>
            </div>
          )}
        </div>

        {/* OPTION 3: GENERAL APP SETTINGS (FREE) */}
        <div className="glass-panel" style={styles.accCard}>
          <div style={styles.accHeader} onClick={() => toggleAccordion(2)}>
            <span>🗓️ Calendar Display & Layout</span>
            <span>{openIndex === 2 ? '▲' : '▼'}</span>
          </div>
          {openIndex === 2 && (
            <div style={styles.accContent(true)}>
              <div className="input-group">
                <span className="input-label">Start Week On</span>
                <select 
                  value={weekStartSunday ? 'sun' : 'mon'} 
                  onChange={(e) => setWeekStartSunday(e.target.value === 'sun')}
                  className="form-input" 
                >
                  <option value="sun">Sunday Start (US Default)</option>
                  <option value="mon">Monday Start</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">Calendar Day Display Info</span>
                <select 
                  value={displayMode} 
                  onChange={(e) => setDisplayMode(e.target.value as any)}
                  className="form-input" 
                >
                  <option value="balance">Ending Account Balances (C/D/CR)</option>
                  <option value="transactions_paid">Cleared Daily Expense totals</option>
                  <option value="transactions_unpaid">Show Unpaid Items warnings</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* OPTION 4: PASSWORD LOCK (PREMIUM) */}
        <div className="glass-panel" style={styles.accCard}>
          <div style={styles.accHeader} onClick={() => toggleAccordion(3)}>
            <span>🔒 Passcode Security {!isPro && '💎'}</span>
            <span>{openIndex === 3 ? '▲' : '▼'}</span>
          </div>
          {openIndex === 3 && (
            <div style={styles.accContent(isPro)} onClick={handlePremiumInteraction}>
              <p style={styles.lockText(!isPro)}>
                🔒 Prevent unauthorized access to your ledger. (Upgrade to Pro required)
              </p>
              <div className="input-group">
                <span className="input-label">Set 4-Digit Passcode</span>
                <input 
                  type="text" 
                  maxLength={4}
                  value={passcode} 
                  onChange={(e) => setPasscode(e.target.value)} 
                  disabled={!isPro}
                  className="form-input" 
                />
              </div>
              <div className="input-group" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="input-label">Simulate Fingerprint Login</span>
                <input 
                  type="checkbox" 
                  checked={useFingerprint} 
                  onChange={(e) => setUseFingerprint(e.target.checked)} 
                  disabled={!isPro} 
                />
              </div>
            </div>
          )}
        </div>

        {/* OPTION 5: DATA MANAGEMENT & CATEGORY LABELS EDITOR */}
        <div className="glass-panel" style={styles.accCard}>
          <div style={styles.accHeader} onClick={() => toggleAccordion(4)}>
            <span>💾 Data Management & Categories</span>
            <span>{openIndex === 4 ? '▲' : '▼'}</span>
          </div>
          {openIndex === 4 && (
            <div style={styles.accContent(true)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="input-label" style={{ margin: 0 }}>Category Labels</span>
                <button 
                  type="button" 
                  style={styles.smallActionBtn}
                  onClick={() => setShowAddCat(prev => !prev)}
                >
                  {showAddCat ? 'Cancel' : '+ Add Category'}
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Click ✏️ on any category below to rename it or customize its icon.
              </p>

              {/* Category Filter Tabs */}
              <div style={styles.catTabRow}>
                <button 
                  type="button" 
                  style={styles.catTabBtn(catTab === 'all')} 
                  onClick={() => setCatTab('all')}
                >
                  All ({Object.keys(activeCategories).length})
                </button>
                <button 
                  type="button" 
                  style={styles.catTabBtn(catTab === 'income')} 
                  onClick={() => setCatTab('income')}
                >
                  Income
                </button>
                <button 
                  type="button" 
                  style={styles.catTabBtn(catTab === 'expense')} 
                  onClick={() => setCatTab('expense')}
                >
                  Expenses
                </button>
              </div>

              {/* Add Category Inline Form */}
              {showAddCat && (
                <form onSubmit={handleAddCatSubmit} style={styles.addCatBox}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.78rem', marginBottom: '8px' }}>
                    Create New Category
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '60px' }}>
                      <span className="input-label" style={{ fontSize: '0.65rem' }}>Icon</span>
                      <input 
                        type="text" 
                        value={newCatIcon} 
                        onChange={(e) => setNewCatIcon(e.target.value)} 
                        maxLength={2}
                        className="form-input" 
                        style={{ textAlign: 'center', padding: '6px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className="input-label" style={{ fontSize: '0.65rem' }}>Category Name</span>
                      <input 
                        type="text" 
                        placeholder="e.g. Subscriptions" 
                        value={newCatName} 
                        onChange={(e) => setNewCatName(e.target.value)} 
                        required
                        className="form-input" 
                        style={{ padding: '6px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span className="input-label" style={{ fontSize: '0.65rem' }}>Type</span>
                      <select 
                        value={newCatType} 
                        onChange={(e) => setNewCatType(e.target.value as any)} 
                        className="form-input"
                        style={{ padding: '6px' }}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    {newCatType === 'expense' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '16px' }}>
                        <input 
                          type="checkbox" 
                          id="isRec"
                          checked={newCatIsRecreation} 
                          onChange={(e) => setNewCatIsRecreation(e.target.checked)} 
                        />
                        <label htmlFor="isRec" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Recreation</label>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.75rem' }}>
                    ✓ Save Category
                  </button>
                </form>
              )}

              {/* Categories Scrollable List */}
              <div style={styles.catScrollList}>
                {filteredCategories.map((cat) => {
                  const isEditing = editingCatId === cat.id;

                  if (isEditing) {
                    return (
                      <div key={cat.id} style={styles.catItemRow}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1 }}>
                          <input 
                            type="text" 
                            value={editingCatIcon} 
                            onChange={(e) => setEditingCatIcon(e.target.value)} 
                            maxLength={2}
                            style={styles.catInlineIconInput}
                          />
                          <input 
                            type="text" 
                            value={editingCatName} 
                            onChange={(e) => setEditingCatName(e.target.value)} 
                            style={styles.catInlineNameInput}
                            autoFocus
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            type="button" 
                            style={styles.catSaveBtn} 
                            onClick={() => handleSaveEdit(cat.id)}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button 
                            type="button" 
                            style={styles.catCancelBtn} 
                            onClick={() => setEditingCatId(null)}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={cat.id} style={styles.catItemRow}>
                      <div style={styles.catItemLeft}>
                        <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                        <span style={styles.catTypeBadge(cat.type, cat.isRecreation)}>
                          {cat.type === 'income' ? 'Income' : cat.isRecreation ? 'Recreation' : 'Required'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          style={styles.catActionBtn} 
                          onClick={() => handleStartEdit(cat)}
                          title="Edit Category Name"
                        >
                          ✏️
                        </button>
                        {onDeleteCategory && !['salary', 'paycheck', 'rent', 'groceries', 'utilities'].includes(cat.id) && (
                          <button 
                            type="button" 
                            style={styles.catActionBtn} 
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                onDeleteCategory(cat.id);
                              }
                            }}
                            title="Delete Category"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset Categories Button */}
              {onResetCategories && (
                <button 
                  type="button" 
                  style={styles.resetCatBtn}
                  onClick={onResetCategories}
                >
                  ↺ Reset Categories to Defaults
                </button>
              )}

            </div>
          )}
        </div>

        {/* OPTION 6: ABOUT VAULT (FREE) */}
        <div className="glass-panel" style={styles.accCard}>
          <div style={styles.accHeader} onClick={() => toggleAccordion(5)}>
            <span>ℹ️ About Iron Vault</span>
            <span>{openIndex === 5 ? '▲' : '▼'}</span>
          </div>
          {openIndex === 5 && (
            <div style={styles.accContent(true)}>
              <div style={styles.avgRow}>
                <span>Current App Version:</span>
                <span style={{ fontWeight: 'bold' }}>v2.4.0-Production</span>
              </div>
              
              <button 
                type="button" 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '10px' }}
                onClick={() => alert('Redirecting to App Store rating page... Thank you for using Iron Vault!')}
              >
                ⭐ Rate Us in App Store
              </button>
            </div>
          )}
        </div>

      </div>

      {/* COMPACT CLEAR ALL LOCAL DATA FOOTER */}
      <div className="glass-panel" style={styles.dangerCardCompact}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--expense)', lineHeight: 1.2 }}>
              Clear All Local Data
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
              Reset accounts & transactions to $0
            </div>
          </div>
        </div>
        <button 
          type="button" 
          style={styles.dangerBtnCompact}
          onClick={handleClearConfirm}
        >
          Reset to $0
        </button>
      </div>
    </div>
  );
};


// ============================================================================
// 2. HELP AND FEEDBACK VIEW
// ============================================================================
export const HelpFeedbackView: React.FC = () => {
  const [topic, setTopic] = useState('help');
  const [msg, setMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg) return;
    
    // Simulate mailto link
    const mailto = `mailto:developer@ironvault.com?subject=IronVault-${topic}&body=${encodeURIComponent(msg)}`;
    window.location.href = mailto;
    
    setMsg('');
    alert('Launching mail software to email developer...');
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div>
        <h2 style={styles.pageTitle}>Help & Feedback</h2>
        <span style={styles.subtitle}>Direct connection to support</span>
      </div>

      <div className="glass-panel" style={styles.chartCard}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
          Have questions, suggested features, or bug reports? Use the portal below to contact our developer directly.
        </p>

        <form onSubmit={handleSend} style={styles.form}>
          <div className="input-group">
            <span className="input-label">Subject Category</span>
            <select 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              className="form-input"
            >
              <option value="help">General Help / Questions</option>
              <option value="feature">Suggest a Feature</option>
              <option value="bug">Report a Bug / Crash</option>
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">Your message details</span>
            <textarea
              required
              rows={4}
              placeholder="Tell us what you need..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="form-input"
              style={{ resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            ✉️ Email Developer
          </button>
        </form>
      </div>
    </div>
  );
};


// ============================================================================
// 3. PURCHASE PRO VIEW (PREMIUM UPGRADE SCREEN)
// ============================================================================
interface PurchaseProProps {
  onUpgradeSuccess: () => void;
  onNavigateBack: () => void;
}

export const PurchaseProView: React.FC<PurchaseProProps> = ({
  onUpgradeSuccess,
  onNavigateBack
}) => {
  const [step, setStep] = useState<'features' | 'checkout' | 'processing'>('features');
  
  // Checkout Form States
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle formatting card number: XXXX XXXX XXXX XXXX
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16);
    const parts = clean.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  // Handle formatting expiry: MM/YY
  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 4);
    if (clean.length > 2) {
      setCardExpiry(`${clean.substring(0, 2)}/${clean.substring(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  // Submit payment handler
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic Validations
    if (!cardName.trim()) {
      setErrorMsg('Cardholder name is required.');
      return;
    }
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 15) {
      setErrorMsg('Invalid card number length.');
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMsg('Invalid expiry date format (MM/YY).');
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMsg('Invalid CVV code.');
      return;
    }
    if (!cardZip.trim()) {
      setErrorMsg('Billing Zip Code is required.');
      return;
    }

    // Move to simulated processing secure loading step
    setStep('processing');
    
    // Simulate payment transaction validation
    setTimeout(() => {
      onUpgradeSuccess();
      alert('🔒 Sandbox Payment Successful!\n\nYour sandbox transaction was completed securely and Iron Vault Pro has been activated!');
    }, 2500);
  };

  if (step === 'processing') {
    return (
      <div style={styles.container} className="animate-fade-in">
        <div className="glass-panel" style={styles.proCheckoutCard}>
          <div style={styles.spinner} className="spin-animation">⏳</div>
          <h3 style={{ ...styles.proTitle, marginTop: '20px' }}>Securely Processing...</h3>
          <p style={{ ...styles.proSubText, margin: '12px 0 24px' }}>
            Encrypting billing details and transmitting to payment gateway. Please do not close or refresh this screen.
          </p>
          <div style={styles.secureBadge}>
            🔒 256-Bit SSL Secured Session
          </div>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div style={styles.container} className="animate-fade-in">
        <div className="glass-panel" style={styles.checkoutFormCard}>
          <div style={styles.checkoutHeader}>
            <button style={styles.backLink} onClick={() => setStep('features')}>◀ Back</button>
            <span style={styles.secureHeader}>🔒 SECURE CHECKOUT</span>
          </div>

          <h3 style={styles.checkoutTitle}>Secure Checkout</h3>
          <div style={styles.checkoutPriceRow}>
            <span>Iron Vault Pro License</span>
            <span style={{ fontWeight: 'bold' }}>$4.99</span>
          </div>

          {/* Sandbox mode notice */}
          <div style={styles.sandboxNotice}>
            <strong>⚠️ SANDBOX TRANSACTION</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', lineHeight: 1.3 }}>
              This is a secure prototype payment page. Do not input real credit card credentials. Fill out the fields with sandbox data to unlock Pro.
            </p>
          </div>

          {errorMsg && <div style={styles.checkoutError}>{errorMsg}</div>}

          <form onSubmit={handlePaySubmit} style={styles.payForm}>
            <div className="input-group">
              <span className="input-label">Cardholder Name</span>
              <input
                type="text"
                placeholder="John Doe"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="input-group">
              <span className="input-label">Card Number</span>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  required
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <span style={styles.cardBrandIcon}>💳</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <span className="input-label">Expiry (MM/YY)</span>
                <input
                  type="text"
                  placeholder="12/28"
                  required
                  value={cardExpiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <span className="input-label">CVV / CVC</span>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="***"
                  required
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  className="form-input"
                />
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">Billing Zip Code</span>
              <input
                type="text"
                maxLength={5}
                placeholder="90210"
                required
                value={cardZip}
                onChange={(e) => setCardZip(e.target.value.replace(/\D/g, ''))}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '14px' }}>
              🔒 Pay $4.99 Securely
            </button>
          </form>

          <div style={styles.footerLock}>
            <span>Certified PCI-DSS Compliant Gateway</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={styles.proCheckoutCard}>
        <div style={styles.proCrown}>💎</div>
        <h2 style={styles.proTitle}>Upgrade to Iron Vault Pro</h2>
        <div style={styles.proPrice}>$4.99 <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>One-Time Payment</span></div>
        
        <p style={styles.proSubText}>
          Unlock the complete dashboard suite and synchronize your bank ledgers.
        </p>

        {/* Feature List */}
        <div style={styles.proFeatureList}>
          <div style={styles.proFeatureRow}>📅 Full 12-Month Calendar View</div>
          <div style={styles.proFeatureRow}>☁️ Multi-Device Cloud Syncing</div>
          <div style={styles.proFeatureRow}>🔔 Smart Reminders & Tones</div>
          <div style={styles.proFeatureRow}>🔒 Fingerprint / Passcode Lock</div>
          <div style={styles.proFeatureRow}>💾 Automated Backup & Restores</div>
          <div style={styles.proFeatureRow}>💼 Unlimited Custom Accounts</div>
        </div>

        {/* Checkout CTA */}
        <button 
          className="btn-primary" 
          style={styles.proCheckoutBtn}
          onClick={() => setStep('checkout')}
        >
          Secure Checkout & Upgrade
        </button>

        <button 
          type="button" 
          style={styles.backBtn}
          onClick={onNavigateBack}
        >
          Cancel & Continue Free
        </button>
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
    minHeight: '100%',
    paddingBottom: '40px',
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
  accordionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  accCard: {
    borderRadius: '12px',
    overflow: 'hidden',
  },
  accHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: '0.88rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  accContent: (isUnlocked: boolean) => ({
    padding: '16px',
    borderTop: '1px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
    opacity: isUnlocked ? 1 : 0.6,
  }),
  lockText: (isLocked: boolean) => ({
    display: isLocked ? 'block' : 'none',
    fontSize: '0.7rem',
    color: 'var(--budget-warning)',
    fontWeight: 'bold',
    marginBottom: '10px',
  }),
  categoryInspectList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    fontSize: '0.75rem',
  },
  dangerBtn: {
    backgroundColor: 'hsla(350, 89%, 60%, 0.12)',
    color: 'var(--expense)',
    border: '1px solid hsla(350, 89%, 60%, 0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '10px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
  },
  chartCard: {
    padding: '16px',
    borderRadius: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  proCheckoutCard: {
    padding: '28px 20px',
    borderRadius: '24px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, hsla(208, 100%, 15%, 0.6) 0%, hsla(265, 85%, 15%, 0.6) 100%)',
    borderColor: 'var(--primary)',
    boxShadow: '0 12px 40px rgba(100,50,250,0.2)',
    margin: 'auto 0',
  },
  proCrown: {
    fontSize: '3rem',
    marginBottom: '10px',
    filter: 'drop-shadow(0 0 10px var(--primary-glow))',
  },
  proTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 800,
  },
  proPrice: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--primary)',
    margin: '10px 0',
  },
  proSubText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    marginBottom: '20px',
  },
  proFeatureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '24px',
  },
  proFeatureRow: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  proCheckoutBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '14px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    marginTop: '12px',
  },
  avgRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    padding: '6px 0',
  },
  spinner: {
    fontSize: '3rem',
    marginBottom: '16px',
    display: 'inline-block',
  },
  secureBadge: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'var(--income)',
    backgroundColor: 'rgba(20, 180, 90, 0.12)',
    padding: '6px 12px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '16px',
  },
  checkoutFormCard: {
    padding: '24px 20px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, hsla(208, 100%, 15%, 0.5) 0%, hsla(265, 85%, 15%, 0.5) 100%)',
    borderColor: 'var(--primary)',
    margin: 'auto 0',
    textAlign: 'left',
  },
  checkoutHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    padding: 0,
  },
  secureHeader: {
    fontSize: '0.68rem',
    fontWeight: 800,
    color: 'var(--income)',
    letterSpacing: '0.5px',
  },
  checkoutTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 800,
    marginBottom: '12px',
    textAlign: 'left',
  },
  checkoutPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-input)',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid var(--border-light)',
  },
  sandboxNotice: {
    backgroundColor: 'rgba(255, 180, 0, 0.1)',
    border: '1px solid rgba(255, 180, 0, 0.25)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: 'var(--budget-warning)',
    textAlign: 'left',
    fontSize: '0.78rem',
    marginBottom: '18px',
  },
  checkoutError: {
    color: 'var(--expense)',
    backgroundColor: 'rgba(220, 50, 80, 0.1)',
    border: '1px solid rgba(220, 50, 80, 0.25)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.75rem',
    textAlign: 'left',
    marginBottom: '16px',
  },
  payForm: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  cardBrandIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.2rem',
    opacity: 0.6,
  },
  footerLock: {
    textAlign: 'center',
    fontSize: '0.65rem',
    color: 'var(--text-tertiary)',
    marginTop: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  smallActionBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: 600,
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  catTabRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '10px',
  },
  catTabBtn: (active: boolean) => ({
    flex: 1,
    padding: '6px 4px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: 600,
    border: '1px solid var(--border-light)',
    background: active ? 'var(--primary)' : 'var(--bg-input)',
    color: active ? '#fff' : 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'center' as const,
  }),
  addCatBox: {
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-card)',
    border: '1px dashed var(--primary)',
    marginBottom: '12px',
  },
  catScrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '260px',
    overflowY: 'auto',
    paddingRight: '2px',
    marginBottom: '8px',
  },
  catItemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    fontSize: '0.78rem',
  },
  catItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  catTypeBadge: (type: 'income' | 'expense', isRec?: boolean) => ({
    fontSize: '0.62rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    color: type === 'income' ? 'var(--income)' : isRec ? 'hsl(265, 85%, 65%)' : 'var(--expense)',
    backgroundColor: type === 'income' ? 'rgba(20, 180, 90, 0.12)' : isRec ? 'rgba(150, 80, 255, 0.12)' : 'rgba(220, 50, 80, 0.12)',
  }),
  catActionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.82rem',
    padding: '3px',
    color: 'var(--text-primary)',
  },
  catInlineIconInput: {
    width: '32px',
    textAlign: 'center' as const,
    padding: '4px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid var(--primary)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
  },
  catInlineNameInput: {
    flex: 1,
    padding: '4px 8px',
    fontSize: '0.78rem',
    borderRadius: '4px',
    border: '1px solid var(--primary)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
  },
  catSaveBtn: {
    background: 'var(--income)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  catCancelBtn: {
    background: 'var(--bg-input)',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border-light)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  resetCatBtn: {
    background: 'none',
    border: '1px dashed var(--border-light)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    padding: '8px',
    fontSize: '0.72rem',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'center' as const,
    marginTop: '6px',
  },
  dangerNotice: {
    backgroundColor: 'rgba(220, 50, 80, 0.1)',
    border: '1px solid rgba(220, 50, 80, 0.25)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: 'var(--expense)',
    marginBottom: '14px',
  },
  dangerCardCompact: {
    borderRadius: '10px',
    padding: '8px 12px',
    border: '1px solid hsla(350, 89%, 60%, 0.25)',
    background: 'linear-gradient(135deg, hsla(350, 89%, 60%, 0.08) 0%, hsla(350, 89%, 60%, 0.02) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '4px',
    flexShrink: 0,
  },
  dangerBtnCompact: {
    backgroundColor: 'hsla(350, 89%, 60%, 0.15)',
    color: 'var(--expense)',
    border: '1px solid hsla(350, 89%, 60%, 0.3)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.74rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  }
};
export default SettingsView;
