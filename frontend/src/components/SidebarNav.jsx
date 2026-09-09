export default function SidebarNav({ activeModule, setActiveModule, currentUser, onOpenLogin, onExitPortal, sidebarWidth, onResizeStart }) {

  const userRole = currentUser ? currentUser.role : null;

  const isAccessible = (module) => {
    if (!currentUser) return true; // Full access preview in staff demo mode
    if (userRole === 'ADMIN') return true;
    if (userRole === 'CASHIER') return ['POS', 'KDS', 'KIOSK'].includes(module);
    if (userRole === 'KITCHEN') return ['KDS'].includes(module);
    return false;
  };

  return (
    <nav
      className="bg-surface-container-lowest text-on-surface h-screen fixed left-0 top-0 flex flex-col py-5 px-3 gap-2 z-50 shadow-md border-r border-outline-variant select-none group"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Draggable Splitter Handle Line */}
      <div
        className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-secondary/40 active:bg-secondary transition-colors z-50 flex items-center justify-center"
        onMouseDown={onResizeStart}
        title="Drag to resize sidebar width"
      >
        <div className="w-0.5 h-8 bg-outline-variant/60 rounded-full group-hover:bg-secondary"></div>
      </div>

      {/* Brand Header */}
      <div className="mb-4 flex flex-col items-center border-b border-outline-variant/60 pb-3">
        <div className="w-11 h-11 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-1.5 shadow-sm border border-secondary-fixed">
          <span className="material-symbols-outlined text-2xl">castle</span>
        </div>
        <h1 className="font-headline-md text-base font-bold text-primary text-center truncate w-full">Rajgad Royal</h1>
        <span className="font-label-sm text-[10px] text-on-surface-variant text-center font-medium truncate w-full">Hospitality & POS OS</span>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-1 flex-grow overflow-y-auto custom-scrollbar">
        <button
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 active:scale-95 ${
            !isAccessible('POS')
              ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
              : activeModule === 'POS'
              ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm border border-secondary-fixed'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
          onClick={() => {
            if (isAccessible('POS')) setActiveModule('POS');
            else alert(`Access Restricted: Cashier POS is disabled for ${userRole} role.`);
          }}
        >
          <span className="material-symbols-outlined text-lg shrink-0">{!isAccessible('POS') ? 'lock' : 'point_of_sale'}</span>
          <span className="font-label-bold text-xs truncate">Cashier POS</span>
        </button>

        <button
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 active:scale-95 ${
            !isAccessible('KDS')
              ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
              : activeModule === 'KDS'
              ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm border border-secondary-fixed'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
          onClick={() => {
            if (isAccessible('KDS')) setActiveModule('KDS');
            else alert(`Access Restricted: KDS is disabled for ${userRole} role.`);
          }}
        >
          <span className="material-symbols-outlined text-lg shrink-0">{!isAccessible('KDS') ? 'lock' : 'restaurant'}</span>
          <span className="font-label-bold text-xs truncate">Kitchen KDS</span>
        </button>

        <button
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 active:scale-95 ${
            !isAccessible('INVENTORY')
              ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
              : activeModule === 'INVENTORY'
              ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm border border-secondary-fixed'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
          onClick={() => {
            if (isAccessible('INVENTORY')) setActiveModule('INVENTORY');
            else alert(`Access Restricted: Inventory & Recipes is restricted to Admin role (Current Role: ${userRole}).`);
          }}
        >
          <span className="material-symbols-outlined text-lg shrink-0">{!isAccessible('INVENTORY') ? 'lock' : 'inventory_2'}</span>
          <span className="font-label-bold text-xs truncate">Inventory & Recipes</span>
        </button>

        <button
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 active:scale-95 ${
            !isAccessible('DASHBOARD')
              ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
              : activeModule === 'DASHBOARD'
              ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm border border-secondary-fixed'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
          onClick={() => {
            if (isAccessible('DASHBOARD')) setActiveModule('DASHBOARD');
            else alert(`Access Restricted: BI Dashboard is restricted to Admin role (Current Role: ${userRole}).`);
          }}
        >
          <span className="material-symbols-outlined text-lg shrink-0">{!isAccessible('DASHBOARD') ? 'lock' : 'dashboard'}</span>
          <span className="font-label-bold text-xs truncate">BI Dashboard</span>
        </button>

        <button
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 active:scale-95 ${
            !isAccessible('REPORTS')
              ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
              : activeModule === 'REPORTS'
              ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm border border-secondary-fixed'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
          onClick={() => {
            if (isAccessible('REPORTS')) setActiveModule('REPORTS');
            else alert(`Access Restricted: Financial Reports is restricted to Admin role (Current Role: ${userRole}).`);
          }}
        >
          <span className="material-symbols-outlined text-lg shrink-0">{!isAccessible('REPORTS') ? 'lock' : 'analytics'}</span>
          <span className="font-label-bold text-xs truncate">Reports & Analytics</span>
        </button>
      </div>

      {/* Staff User Switcher Footer */}
      <div className="flex flex-col gap-2 mt-auto border-t border-outline-variant/60 pt-2.5">
        {currentUser ? (
          <div className="flex items-center justify-between p-2 bg-surface-container-high rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-secondary text-lg">account_circle</span>
              <div className="truncate">
                <div className="font-label-bold text-[11px] text-on-surface truncate">{currentUser.full_name || currentUser.username}</div>
                <div className="text-[9px] text-on-surface-variant uppercase font-bold">{currentUser.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container-highest"
                onClick={onOpenLogin}
                title="Quick Switch Role / PIN"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
              </button>
              {onExitPortal && (
                <button
                  className="text-on-surface-variant hover:text-error p-1 rounded hover:bg-surface-container-highest"
                  onClick={onExitPortal}
                  title="Exit to Landing Portal"
                >
                  <span className="material-symbols-outlined text-sm">power_settings_new</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface p-2 rounded-xl font-label-bold text-xs transition-colors shadow-sm"
              onClick={onOpenLogin}
            >
              <span className="material-symbols-outlined text-sm text-primary">lock</span>
              <span className="truncate">Switch PIN</span>
            </button>
            {onExitPortal && (
              <button
                className="p-2 bg-surface-container-high hover:bg-error-container hover:text-error border border-outline-variant text-on-surface-variant rounded-xl transition-colors shadow-sm"
                onClick={onExitPortal}
                title="Exit to Landing Portal"
              >
                <span className="material-symbols-outlined text-sm">power_settings_new</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

