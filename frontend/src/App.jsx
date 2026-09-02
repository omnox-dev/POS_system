import React, { useState } from 'react';
import KioskView from './views/KioskView';
import PosView from './views/PosView';
import KdsView from './views/KdsView';
import InventoryView from './views/InventoryView';
import DashboardView from './views/DashboardView';
import ReportsView from './views/ReportsView';
import { loginUser } from './api/client';
import { Smartphone, Monitor, Database, BarChart3, UtensilsCrossed, FileSpreadsheet, Lock, UserCheck } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState('KIOSK'); // KIOSK, POS, KDS, INVENTORY, DASHBOARD, REPORTS
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const handlePinLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await loginUser({ pin_code: pinCode });
      setCurrentUser(res.user);
      setShowLoginModal(false);
      setPinCode('');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  return (
    <div>
      {/* Global Header & Module Switcher */}
      <header className="app-header">
        <div className="brand-title">
          <Database size={22} />
          <span>RESTAURANT OS</span>
          <span className="brand-badge">FastAPI + SQLite</span>
        </div>

        <nav className="module-switcher">
          <button
            className={`switcher-btn ${activeModule === 'KIOSK' ? 'active' : ''}`}
            onClick={() => setActiveModule('KIOSK')}
          >
            <Smartphone size={16} /> 1. Self-Ordering Kiosk
          </button>

          <button
            className={`switcher-btn ${activeModule === 'POS' ? 'active' : ''}`}
            onClick={() => setActiveModule('POS')}
          >
            <Monitor size={16} /> 2. Cashier POS
          </button>

          <button
            className={`switcher-btn ${activeModule === 'KDS' ? 'active' : ''}`}
            onClick={() => setActiveModule('KDS')}
          >
            <UtensilsCrossed size={16} /> 3. Kitchen KDS
          </button>

          <button
            className={`switcher-btn ${activeModule === 'INVENTORY' ? 'active' : ''}`}
            onClick={() => setActiveModule('INVENTORY')}
          >
            <Database size={16} /> 4. Inventory & Recipes
          </button>

          <button
            className={`switcher-btn ${activeModule === 'DASHBOARD' ? 'active' : ''}`}
            onClick={() => setActiveModule('DASHBOARD')}
          >
            <BarChart3 size={16} /> 5. BI Dashboard
          </button>

          <button
            className={`switcher-btn ${activeModule === 'REPORTS' ? 'active' : ''}`}
            onClick={() => setActiveModule('REPORTS')}
          >
            <FileSpreadsheet size={16} /> 6. Reports & Analytics
          </button>
        </nav>

        {/* Auth / PIN Status Badge */}
        <div style={{ marginLeft: '12px' }}>
          {currentUser ? (
            <span className="wf-badge wf-badge-normal" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setCurrentUser(null)}>
              <UserCheck size={14} /> {currentUser.full_name || currentUser.username} ({currentUser.role})
            </span>
          ) : (
            <button className="wf-btn wf-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowLoginModal(true)}>
              <Lock size={14} /> Staff PIN Login
            </button>
          )}
        </div>
      </header>

      {/* Main View Shell */}
      <main className="main-container">
        {activeModule === 'KIOSK' && <KioskView />}
        {activeModule === 'POS' && <PosView />}
        {activeModule === 'KDS' && <KdsView />}
        {activeModule === 'INVENTORY' && <InventoryView />}
        {activeModule === 'DASHBOARD' && <DashboardView />}
        {activeModule === 'REPORTS' && <ReportsView />}
      </main>

      {/* Cashier PIN Quick Login Modal */}
      {showLoginModal && (
        <div className="wf-modal-overlay">
          <div className="wf-modal-card" style={{ maxWidth: '320px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '8px' }}>Staff Quick PIN Login</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', marginBottom: '16px' }}>
              Enter 4-digit Cashier PIN (e.g. Cashier: <code>1234</code>, Kitchen: <code>5678</code>, Admin: <code>9999</code>)
            </p>
            <form onSubmit={handlePinLogin}>
              <input
                type="password"
                maxLength="4"
                className="wf-input"
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', marginBottom: '12px' }}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="••••"
                autoFocus
                required
              />
              {loginError && (
                <div style={{ color: 'var(--wf-danger)', fontSize: '0.8rem', marginBottom: '12px' }}>{loginError}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button type="button" className="wf-btn wf-btn-secondary" onClick={() => setShowLoginModal(false)}>Cancel</button>
                <button type="submit" className="wf-btn wf-btn-primary">Authenticate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


