import React, { useState, useEffect } from 'react';
import { fetchSalesReport, fetchTopDishesReport, fetchStockValuationReport } from '../api/client';
import { FileSpreadsheet, TrendingUp, Award, DollarSign, Download, PieChart, AlertCircle } from 'lucide-react';

export default function ReportsView() {
  const [salesReport, setSalesReport] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [stockValuation, setStockValuation] = useState(null);
  const [activeTab, setActiveTab] = useState('SALES'); // SALES, TOP_DISHES, STOCK_VALUATION

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const sales = await fetchSalesReport();
      const dishes = await fetchTopDishesReport();
      const val = await fetchStockValuationReport();
      setSalesReport(sales);
      setTopDishes(dishes);
      setStockValuation(val);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/reports/export-csv', '_blank');
  };

  return (
    <div>
      {/* Top Header & Export Controls */}
      <div className="wf-panel" style={{ padding: '12px 20px', marginBottom: '20px' }}>
        <div className="flex-between">
          <span className="wf-title" style={{ fontSize: '1.2rem' }}>
            <FileSpreadsheet size={22} color="var(--wf-accent)" /> Financial & Operational Reports
          </span>

          <div className="flex-gap-8">
            <button className="wf-btn wf-btn-primary" onClick={handleExportCSV}>
              <Download size={16} /> Export Sales Summary CSV
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex-gap-8" style={{ marginBottom: '20px' }}>
        <button
          className={`wf-btn ${activeTab === 'SALES' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
          onClick={() => setActiveTab('SALES')}
        >
          <TrendingUp size={16} /> Daily Sales & Tax Report
        </button>
        <button
          className={`wf-btn ${activeTab === 'TOP_DISHES' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
          onClick={() => setActiveTab('TOP_DISHES')}
        >
          <Award size={16} /> Top Dishes Performance
        </button>
        <button
          className={`wf-btn ${activeTab === 'STOCK_VALUATION' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
          onClick={() => setActiveTab('STOCK_VALUATION')}
        >
          <DollarSign size={16} /> Stock Asset Valuation & Wastage
        </button>
      </div>

      {/* TAB 1: DAILY SALES & TAX */}
      {activeTab === 'SALES' && salesReport && (
        <div>
          {/* Executive KPI Cards */}
          <div className="wf-card-grid" style={{ marginBottom: '20px' }}>
            <div className="wf-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>Net Total Revenue</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--wf-success)', fontFamily: 'var(--font-mono)' }}>
                ₹{salesReport.summary?.net_revenue.toFixed(2)}
              </div>
            </div>

            <div className="wf-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>Gross Subtotal</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--wf-accent)', fontFamily: 'var(--font-mono)' }}>
                ₹{salesReport.summary?.gross_subtotal.toFixed(2)}
              </div>
            </div>

            <div className="wf-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>GST Tax Collected</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--wf-warning)', fontFamily: 'var(--font-mono)' }}>
                ₹{salesReport.summary?.total_tax_collected.toFixed(2)}
              </div>
            </div>

            <div className="wf-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>Total Discounts & Loyalty</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--wf-danger)', fontFamily: 'var(--font-mono)' }}>
                -₹{salesReport.summary?.total_discounts.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="wf-panel">
            <div className="wf-panel-header">
              <span className="wf-title"><PieChart size={18} /> Revenue Breakdown by Payment Method</span>
            </div>
            <div className="wf-card-grid">
              {Object.entries(salesReport.payment_breakdown || {}).map(([mode, amt]) => (
                <div key={mode} className="wf-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>{mode}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--wf-accent)' }}>₹{amt.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP DISHES */}
      {activeTab === 'TOP_DISHES' && (
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title"><Award size={18} /> Dish Sales Performance Ranking</span>
            <span className="wf-badge wf-badge-info">{topDishes.length} Items Sold</span>
          </div>

          <div className="wf-table-container">
            <table className="wf-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Dish Name</th>
                  <th>Total Qty Sold</th>
                  <th>Gross Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {topDishes.map((dish, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--wf-warning)' }}>#{idx + 1}</td>
                    <td style={{ fontWeight: 'bold' }}>{dish.dish_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{dish.total_qty_sold} servings</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--wf-success)' }}>
                      ₹{dish.gross_revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK ASSET VALUATION & WASTAGE */}
      {activeTab === 'STOCK_VALUATION' && stockValuation && (
        <div>
          <div className="wf-card-grid" style={{ marginBottom: '20px' }}>
            <div className="wf-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>Total Inventory Asset Valuation</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--wf-accent)', fontFamily: 'var(--font-mono)' }}>
                ₹{stockValuation.total_stock_asset_value.toFixed(2)}
              </div>
            </div>

            <div className="wf-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>Total Wastage Cost Loss</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--wf-danger)', fontFamily: 'var(--font-mono)' }}>
                ₹{stockValuation.total_wastage_cost_loss.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="wf-panel">
            <div className="wf-panel-header">
              <span className="wf-title" style={{ color: 'var(--wf-danger)' }}>
                <AlertCircle size={18} /> Detailed Stock Wastage Log
              </span>
            </div>

            <div className="wf-table-container">
              <table className="wf-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Ingredient</th>
                    <th>Qty Lost</th>
                    <th>Financial Loss (₹)</th>
                    <th>Reason / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {stockValuation.wastage_details?.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--wf-text-muted)' }}>No stock wastage recorded.</td>
                    </tr>
                  ) : (
                    stockValuation.wastage_details?.map((w, idx) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(w.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{w.ingredient}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{w.quantity_lost} {w.unit}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--wf-danger)' }}>
                          ₹{w.cost_loss.toFixed(2)}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>{w.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
