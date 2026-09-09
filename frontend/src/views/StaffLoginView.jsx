import React, { useState } from 'react';
import { loginUser } from '../api/client';

export default function StaffLoginView({ onLoginSuccess, onBackToLanding }) {
  const [selectedRole, setSelectedRole] = useState('CASHIER'); // CASHIER, KITCHEN, ADMIN
  const [pinCode, setPinCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const rolesInfo = {
    CASHIER: {
      title: "Cashier Terminal",
      subtitle: "POS Billing & Table Transfers",
      pinHint: "1234",
      icon: "point_of_sale",
      color: "border-secondary text-secondary bg-secondary-container/10"
    },
    KITCHEN: {
      title: "Master Chef Station",
      subtitle: "Kitchen Display System (KDS Live)",
      pinHint: "5678",
      icon: "skillet",
      color: "border-on-tertiary-container text-on-tertiary-container bg-tertiary-container/10"
    },
    ADMIN: {
      title: "System Administrator",
      subtitle: "Full OS Access, Recipes & Reports",
      pinHint: "9999",
      icon: "verified_user",
      color: "border-primary text-primary bg-primary/10"
    }
  };

  const handleKeypadPress = (val) => {
    setLoginError('');
    if (val === 'CLEAR') {
      setPinCode('');
    } else if (val === 'BACK') {
      setPinCode(prev => prev.slice(0, -1));
    } else if (pinCode.length < 4) {
      const nextPin = pinCode + val;
      setPinCode(nextPin);
      if (nextPin.length === 4) {
        authenticatePin(nextPin);
      }
    }
  };

  const authenticatePin = async (codeToTest) => {
    setLoading(true);
    setLoginError('');
    try {
      const res = await loginUser({ pin_code: codeToTest });
      onLoginSuccess(res.user);
    } catch (err) {
      setLoginError(err.message || "Invalid 4-digit Staff PIN");
      setPinCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Top Back Navigation */}
      <button
        className="absolute top-6 left-6 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container-high transition-all shadow-sm flex items-center gap-2"
        onClick={onBackToLanding}
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Return to Landing Portal
      </button>

      {/* Main Glassmorphism Authentication Frame */}
      <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-8 relative z-10 transition-all duration-500">
        {/* Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-container/20 px-3 py-1 rounded-full mb-1">
            <span className="material-symbols-outlined text-sm">shield</span>
            Rajgad Royal RBAC Security Engine
          </div>
          <h2 className="text-2xl font-bold text-primary">Staff Portal Login</h2>
          <p className="text-xs text-on-surface-variant">Select your staff role and enter your 4-digit Security PIN</p>
        </div>

        {/* Role Selector Cards */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(rolesInfo).map(([roleKey, info]) => (
            <div
              key={roleKey}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 ${
                selectedRole === roleKey
                  ? `${info.color} shadow-md scale-105 font-bold`
                  : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline'
              }`}
              onClick={() => {
                setSelectedRole(roleKey);
                setPinCode('');
                setLoginError('');
              }}
            >
              <span className="material-symbols-outlined text-2xl">{info.icon}</span>
              <div>
                <div className="font-bold text-xs leading-tight">{info.title}</div>
                <div className="text-[10px] opacity-75 mt-0.5 font-mono">PIN: {info.pinHint}</div>
              </div>
            </div>
          ))}
        </div>

        {/* PIN Display & Keypad */}
        <div className="max-w-xs mx-auto space-y-4 text-center">
          {/* PIN Input Display Boxes */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-bold transition-all ${
                  pinCode.length > idx
                    ? 'border-primary bg-primary/10 text-primary scale-105'
                    : 'border-outline-variant bg-surface'
                }`}
              >
                {pinCode.length > idx ? '•' : ''}
              </div>
            ))}
          </div>

          {loginError && (
            <div className="text-xs font-bold text-error bg-error-container/40 p-2 rounded-lg border border-error/50 animate-pulse">
              {loginError}
            </div>
          )}

          {/* Numeric Touch Keypad */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                className="h-12 bg-surface-container-high hover:bg-secondary-fixed text-on-surface font-bold text-lg rounded-xl transition-all active:scale-95 shadow-sm border border-outline-variant/60"
                onClick={() => handleKeypadPress(num.toString())}
                disabled={loading}
              >
                {num}
              </button>
            ))}
            <button
              className="h-12 bg-surface-container-high hover:bg-error-container text-error font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm border border-outline-variant/60 flex items-center justify-center"
              onClick={() => handleKeypadPress('CLEAR')}
              disabled={loading}
            >
              Clear
            </button>
            <button
              className="h-12 bg-surface-container-high hover:bg-secondary-fixed text-on-surface font-bold text-lg rounded-xl transition-all active:scale-95 shadow-sm border border-outline-variant/60"
              onClick={() => handleKeypadPress('0')}
              disabled={loading}
            >
              0
            </button>
            <button
              className="h-12 bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm border border-outline-variant/60 flex items-center justify-center"
              onClick={() => handleKeypadPress('BACK')}
              disabled={loading}
            >
              <span className="material-symbols-outlined text-base">backspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
