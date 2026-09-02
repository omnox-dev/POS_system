import React, { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '../api/client';
import { TrendingUp, ShoppingBag, AlertTriangle, Users, DollarSign, PieChart } from 'lucide-react';

export default function DashboardView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="wf-panel" style={{ textAlign: 'center', padding: '40px' }}>Loading Executive Dashboard metrics...</div>;
  }

  const { summary, payment_breakdown, order_type_breakdown, low_stock_items } = metrics || {};

  return (
    <div>
      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="wf-card" style={{ borderColor: 'var(--wf-success)' }}>
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Gross Revenue</span>
            <DollarSign size={18} style={{ color: 'var(--wf-success)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--wf-success)' }}>
            ₹{summary?.total_revenue?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', marginTop: '4px' }}>
            From {summary?.billed_orders_count || 0} completed bills
          </div>
        </div>

        <div className="wf-card" style={{ borderColor: 'var(--wf-accent)' }}>
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Orders Placed</span>
            <ShoppingBag size={18} style={{ color: 'var(--wf-accent)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
            {summary?.total_orders || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', marginTop: '4px' }}>
            Kiosk & Cashier POS combined
          </div>
        </div>

        <div className="wf-card">
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Avg Order Value (AOV)</span>
            <TrendingUp size={18} style={{ color: 'var(--wf-warning)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
            ₹{summary?.average_order_value?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', marginTop: '4px' }}>
            Average basket size per customer
          </div>
        </div>

        <div className="wf-card" style={{ borderColor: summary?.low_stock_alerts_count > 0 ? 'var(--wf-danger)' : 'var(--wf-border)' }}>
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Low Stock Alerts</span>
            <AlertTriangle size={18} style={{ color: summary?.low_stock_alerts_count > 0 ? 'var(--wf-danger)' : 'var(--wf-text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: summary?.low_stock_alerts_count > 0 ? 'var(--wf-danger)' : 'var(--wf-text-main)' }}>
            {summary?.low_stock_alerts_count || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', marginTop: '4px' }}>
            Raw materials below minimum threshold
          </div>
        </div>

        <div className="wf-card">
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Table Occupancy</span>
            <Users size={18} style={{ color: 'var(--wf-accent)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
            {summary?.occupied_tables || 0} / {summary?.total_tables || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', marginTop: '4px' }}>
            Active occupied restaurant tables
          </div>
        </div>
      </div>

      <div className="view-grid-2">
        {/* Payment & Channel Breakdown */}
        <div>
          <div className="wf-panel">
            <div className="wf-panel-header">
              <span className="wf-title"><PieChart size={18} /> Sales Channel & Payment Method Distribution</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginBottom: '8px' }}>Payment Mode Revenue:</h5>
                {Object.keys(payment_breakdown || {}).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>No completed sales payments yet.</div>
                ) : (
                  Object.entries(payment_breakdown).map(([mode, val]) => (
                    <div key={mode} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--wf-border)', fontSize: '0.85rem' }}>
                      <span className="wf-badge wf-badge-info">{mode}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>₹{val.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginBottom: '8px' }}>Order Types Count:</h5>
                {Object.keys(order_type_breakdown || {}).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>No order channel stats yet.</div>
                ) : (
                  Object.entries(order_type_breakdown).map(([type, cnt]) => (
                    <div key={type} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--wf-border)', fontSize: '0.85rem' }}>
                      <span className="wf-badge wf-badge-normal">{type}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{cnt} Orders</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Warning List */}
        <div>
          <div className="wf-panel">
            <div className="wf-panel-header">
              <span className="wf-title" style={{ color: low_stock_items?.length > 0 ? 'var(--wf-danger)' : 'var(--wf-text-main)' }}>
                <AlertTriangle size={18} /> Real-Time Inventory Stock Warnings
              </span>
              <span className="wf-badge wf-badge-danger">{low_stock_items?.length || 0} Alerts</span>
            </div>

            {low_stock_items?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--wf-success)', border: '1px dashed var(--wf-success)', borderRadius: '6px' }}>
                ✅ All inventory stock levels are operating above minimum threshold!
              </div>
            ) : (
              <div className="wf-table-container">
                <table className="wf-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Current Stock</th>
                      <th>Min Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {low_stock_items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--wf-danger)' }}>{item.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{item.current_stock} {item.unit}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--wf-text-muted)' }}>{item.min_stock} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
