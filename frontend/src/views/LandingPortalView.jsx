import React from 'react';

export default function LandingPortalView({ onSelectCustomerKiosk, onSelectStaffPortal }) {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background Royal Decorative Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>

      {/* Main Header */}
      <div className="text-center max-w-2xl mb-12 relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border border-secondary-fixed mb-2">
          <span className="material-symbols-outlined text-sm">castle</span>
          Rajgad Royal Hospitality Management OS
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
          Welcome to Rajgad Dining
        </h1>
        <p className="text-sm text-on-surface-variant max-w-lg mx-auto">
          Please select your portal to proceed into the system.
        </p>
      </div>

      {/* Dual Entry Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full relative z-10">
        {/* Portal 1: Customer System (Atithi Devo Bhava) */}
        <div
          className="bg-surface-container-lowest border-2 border-outline-variant hover:border-secondary rounded-2xl p-8 flex flex-col items-center text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
          onClick={onSelectCustomerKiosk}
        >
          <div className="absolute top-0 right-0 bg-secondary text-on-secondary text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            Guest Portal
          </div>

          <div className="w-20 h-20 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md border border-secondary-fixed">
            <span className="material-symbols-outlined text-4xl">restaurant_menu</span>
          </div>

          <h2 className="text-2xl font-bold text-primary mb-2">
            Atithi Devo Bhava Kiosk
          </h2>

          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed flex-1">
            "Guest is God" — Customer Self-Ordering Kiosk. Browse royal delicacies, customize menu options, and dispatch live kitchen orders.
          </p>

          <button className="w-full py-3.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm group-hover:bg-secondary-container group-hover:text-on-secondary-container shadow-md transition-colors flex items-center justify-center gap-2">
            <span>Enter Customer Kiosk</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

        {/* Portal 2: Rajgad Royal Staff OS (RBAC Dedicated Login) */}
        <div
          className="bg-surface-container-lowest border-2 border-outline-variant hover:border-primary rounded-2xl p-8 flex flex-col items-center text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
          onClick={onSelectStaffPortal}
        >
          <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            Staff Authentication
          </div>

          <div className="w-20 h-20 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md border border-primary">
            <span className="material-symbols-outlined text-4xl">shield_person</span>
          </div>

          <h2 className="text-2xl font-bold text-primary mb-2">
            Rajgad Royal Staff OS
          </h2>

          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed flex-1">
            Dedicated Staff Portal with Role-Based Access Control (RBAC). Authenticate as Administrator, Cashier, or Master Chef.
          </p>

          <button className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm group-hover:bg-primary-container shadow-md transition-colors flex items-center justify-center gap-2">
            <span>Staff PIN Login</span>
            <span className="material-symbols-outlined text-base">lock</span>
          </button>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="mt-12 text-xs text-on-surface-variant font-mono">
        Rajgad Hospitality OS v2.5 • Powered by FastAPI & SQLite
      </div>
    </div>
  );
}
