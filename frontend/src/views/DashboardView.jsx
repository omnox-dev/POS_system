import React, { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '../api/client';

export default function DashboardView() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await fetchDashboardMetrics();
      setMetrics(res);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        Loading Rajgad Executive Dashboard...
      </div>
    );
  }

  const { summary, payment_breakdown, order_type_breakdown, low_stock_items } = metrics;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-2rem)] w-full bg-background rounded-xl border border-outline-variant p-6 overflow-y-auto shadow-lg">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="font-bold text-2xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl">dashboard</span>
            Rajgad Royal Executive BI Dashboard
          </h1>
          <p className="text-xs text-on-surface-variant">Live Revenue, Orders, Occupancy Rate & Inventory KPI Analytics</p>
        </div>

        <button
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-2"
          onClick={loadMetrics}
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh Live KPIs
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant text-xs font-bold">
            <span>TOTAL REVENUE</span>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <div className="text-3xl font-bold font-mono text-secondary">₹{summary.total_revenue?.toFixed(2)}</div>
          <div className="text-[11px] text-on-surface-variant">Billed Orders: {summary.billed_orders_count}</div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant text-xs font-bold">
            <span>AVERAGE ORDER VALUE (AOV)</span>
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
          <div className="text-3xl font-bold font-mono text-primary">₹{summary.average_order_value?.toFixed(2)}</div>
          <div className="text-[11px] text-on-surface-variant">Total Orders Placed: {summary.total_orders}</div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant text-xs font-bold">
            <span>TABLE OCCUPANCY RATE</span>
            <span className="material-symbols-outlined text-tertiary-container">table_restaurant</span>
          </div>
          <div className="text-3xl font-bold font-mono text-on-tertiary-container">
            {summary.total_tables > 0 ? ((summary.occupied_tables / summary.total_tables) * 100).toFixed(0) : 0}%
          </div>
          <div className="text-[11px] text-on-surface-variant">
            {summary.occupied_tables} of {summary.total_tables} Tables Occupied
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant text-xs font-bold">
            <span>LOW STOCK ALERTS</span>
            <span className="material-symbols-outlined text-error">warning</span>
          </div>
          <div className="text-3xl font-bold font-mono text-error">{summary.low_stock_alerts_count}</div>
          <div className="text-[11px] text-on-surface-variant">Ingredients Below Minimum Stock Limit</div>
        </div>
      </div>

      {/* Analytics Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Revenue Breakdown */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-secondary">pie_chart</span>
            Revenue by Payment Method
          </h3>

          <div className="space-y-3">
            {Object.entries(payment_breakdown || {}).map(([mode, amt]) => (
              <div key={mode} className="flex justify-between items-center p-3 rounded-lg border border-outline-variant bg-surface-container-low">
                <span className="font-bold text-sm text-on-surface">{mode}</span>
                <span className="font-mono font-bold text-base text-primary">₹{amt.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Type Distribution */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary">bar_chart</span>
            Order Type Breakdown
          </h3>

          <div className="space-y-3">
            {Object.entries(order_type_breakdown || {}).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center p-3 rounded-lg border border-outline-variant bg-surface-container-low">
                <span className="font-bold text-sm text-on-surface">{type}</span>
                <span className="font-mono font-bold text-base text-secondary">{count} Orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Low Stock Alerts Banner */}
      {low_stock_items?.length > 0 && (
        <div className="bg-error-container/20 border border-error p-6 rounded-xl shadow-sm space-y-3">
          <h3 className="font-bold text-lg text-error flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            Urgent Reorder Required: Ingredients Below Minimum Limit
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {low_stock_items.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest p-3 rounded-lg border border-error/40 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-on-surface">{item.name}</div>
                  <div className="font-mono text-error font-bold">Current: {item.current_stock} {item.unit}</div>
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono">Min: {item.min_stock} {item.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
