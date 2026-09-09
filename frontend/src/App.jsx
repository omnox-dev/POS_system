import React, { useState } from 'react';
import LandingPortalView from './views/LandingPortalView';
import StaffLoginView from './views/StaffLoginView';
import SidebarNav from './components/SidebarNav';
import KioskView from './views/KioskView';
import PosView from './views/PosView';
import KdsView from './views/KdsView';
import InventoryView from './views/InventoryView';
import DashboardView from './views/DashboardView';
import ReportsView from './views/ReportsView';
import { loginUser } from './api/client';

export default function App() {
  // Main Portal Navigation Modes: 'LANDING', 'CUSTOMER_KIOSK', 'STAFF_LOGIN', 'STAFF_APP'
  const [portalMode, setPortalMode] = useState('LANDING');
  const [activeModule, setActiveModule] = useState('POS'); // POS, KDS, INVENTORY, DASHBOARD, REPORTS
  const [currentUser, setCurrentUser] = useState(null);

  // Quick In-App Staff PIN Login Modal State
  const [showQuickPinModal, setShowQuickPinModal] = useState(false);
  const [quickPinCode, setQuickPinCode] = useState('');
  const [quickPinError, setQuickPinError] = useState('');

  // Dynamic Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const handleSidebarResizeStart = (e) => {
    e.preventDefault();
    setIsResizingSidebar(true);

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.min(Math.max(moveEvent.clientX, 170), 380);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleStaffLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'KITCHEN') {
      setActiveModule('KDS');
    } else if (user.role === 'CASHIER') {
      setActiveModule('POS');
    } else {
      setActiveModule('POS');
    }
    setPortalMode('STAFF_APP');
  };

  const handleQuickPinSubmit = async (e) => {
    e.preventDefault();
    setQuickPinError('');
    try {
      const res = await loginUser({ pin_code: quickPinCode });
      setCurrentUser(res.user);
      if (res.user.role === 'KITCHEN') {
        setActiveModule('KDS');
      } else if (res.user.role === 'CASHIER') {
        setActiveModule('POS');
      }
      setShowQuickPinModal(false);
      setQuickPinCode('');
    } catch (err) {
      setQuickPinError(err.message || 'Invalid Staff PIN');
    }
  };

  const handleExitToPortal = () => {
    setCurrentUser(null);
    setPortalMode('LANDING');
  };

  // Render 1: Main Landing Entry Portal
  if (portalMode === 'LANDING') {
    return (
      <LandingPortalView
        onSelectCustomerKiosk={() => setPortalMode('CUSTOMER_KIOSK')}
        onSelectStaffPortal={() => setPortalMode('STAFF_LOGIN')}
      />
    );
  }

  // Render 2: Dedicated Staff Login Page (RBAC 3 Roles + 4-Digit Keypad)
  if (portalMode === 'STAFF_LOGIN') {
    return (
      <StaffLoginView
        onLoginSuccess={handleStaffLoginSuccess}
        onBackToLanding={() => setPortalMode('LANDING')}
      />
    );
  }

  // Render 3: Customer Self-Ordering Kiosk Portal
  if (portalMode === 'CUSTOMER_KIOSK') {
    return (
      <div className="min-h-screen bg-background p-4 relative">
        <button
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg hover:bg-primary-container transition-all flex items-center gap-2"
          onClick={() => setPortalMode('LANDING')}
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Exit Kiosk & Return to Portal
        </button>
        <KioskView />
      </div>
    );
  }

  // Render 4: Role-Scoped Rajgad Royal Staff OS
  return (
    <div className={`min-h-screen bg-background text-on-surface font-body-md flex w-full ${isResizingSidebar ? 'select-none cursor-col-resize' : ''}`}>
      {/* BistroFlow Left Sidebar Navigation */}
      <SidebarNav
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        currentUser={currentUser}
        onOpenLogin={() => setShowQuickPinModal(true)}
        onExitPortal={handleExitToPortal}
        sidebarWidth={sidebarWidth}
        onResizeStart={handleSidebarResizeStart}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 min-h-screen bg-background overflow-x-hidden transition-none" style={{ marginLeft: `${sidebarWidth}px` }}>
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant/40">
          <div className="flex items-center gap-2">
            <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-secondary-fixed">
              {currentUser?.role || 'STAFF DEMO'} MODE
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Authenticated User: <strong>{currentUser?.full_name || currentUser?.username || 'Staff Member'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 bg-surface-container-high hover:bg-primary-container hover:text-primary text-on-surface-variant rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-outline-variant/60"
              onClick={() => setShowQuickPinModal(true)}
              title="Switch Staff Role via PIN Modal"
            >
              <span className="material-symbols-outlined text-sm">swap_horiz</span>
              Switch Role / PIN
            </button>

            <button
              className="px-3 py-1 bg-surface-container-high hover:bg-error-container hover:text-error text-on-surface-variant rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-outline-variant/60"
              onClick={handleExitToPortal}
              title="Return to Main Portal"
            >
              <span className="material-symbols-outlined text-sm">power_settings_new</span>
              Exit Portal
            </button>
          </div>
        </div>

        {activeModule === 'POS' && <PosView />}
        {activeModule === 'KDS' && <KdsView />}
        {activeModule === 'INVENTORY' && <InventoryView />}
        {activeModule === 'DASHBOARD' && <DashboardView />}
        {activeModule === 'REPORTS' && <ReportsView />}
      </main>

      {/* Quick Staff PIN Authentication Modal (In-OS Popup) */}
      {showQuickPinModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl border-2 border-outline-variant p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>

            <div>
              <h4 className="font-bold text-lg text-primary">Quick Staff PIN Switch</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Enter Staff PIN (Cashier: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">1234</code>, Kitchen: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">5678</code>, Admin: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">9999</code>)
              </p>
            </div>

            <form onSubmit={handleQuickPinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength="4"
                className="w-full text-center text-2xl font-mono tracking-widest py-3 border-2 border-outline-variant rounded-xl bg-surface focus:border-primary outline-none"
                value={quickPinCode}
                onChange={(e) => setQuickPinCode(e.target.value)}
                placeholder="••••"
                autoFocus
                required
              />
              {quickPinError && (
                <div className="text-xs text-error font-bold bg-error-container/40 p-2 rounded-lg border border-error/50">
                  {quickPinError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold hover:bg-surface-variant"
                  onClick={() => {
                    setShowQuickPinModal(false);
                    setQuickPinCode('');
                    setQuickPinError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container shadow-sm"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
