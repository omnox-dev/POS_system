import React, { useState, useEffect } from 'react';
import { fetchSalesReport, fetchTopDishesReport, fetchStockValuationReport } from '../api/client';

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
    <div className="flex flex-col gap-6 h-[calc(100vh-2rem)] w-full bg-background rounded-xl border border-outline-variant p-6 overflow-y-auto shadow-lg">
      {/* Top Header & Export Controls */}
      <div className="flex justify-between items-center bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="font-bold text-2xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl">analytics</span>
            Rajgad Royal Financial & Operational Reports
          </h1>
          <p className="text-xs text-on-surface-variant">Daily Revenue, GST Taxes, Top Selling Dishes & Inventory Valuation</p>
        </div>

        <button
          className="px-5 py-2.5 bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
          onClick={handleExportCSV}
        >
          <span className="material-symbols-outlined text-base">download</span>
          Export Sales Summary CSV
        </button>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex gap-2">
        <button
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'SALES' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest'
          }`}
          onClick={() => setActiveTab('SALES')}
        >
          Daily Sales & GST Tax Report
        </button>
        <button
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'TOP_DISHES' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest'
          }`}
          onClick={() => setActiveTab('TOP_DISHES')}
        >
          Top Selling Dishes Ranking
        </button>
        <button
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'STOCK_VALUATION' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest'
          }`}
          onClick={() => setActiveTab('STOCK_VALUATION')}
        >
          Stock Asset Valuation & Wastage
        </button>
      </div>

      {/* TAB 1: DAILY SALES & TAX */}
      {activeTab === 'SALES' && salesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="text-xs text-on-surface-variant font-bold">NET TOTAL REVENUE</div>
              <div className="text-3xl font-bold font-mono text-on-tertiary-container">
                ₹{salesReport.summary?.net_revenue.toFixed(2)}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="text-xs text-on-surface-variant font-bold">GROSS SUBTOTAL</div>
              <div className="text-3xl font-bold font-mono text-primary">
                ₹{salesReport.summary?.gross_subtotal.toFixed(2)}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="text-xs text-on-surface-variant font-bold">GST TAX COLLECTED</div>
              <div className="text-3xl font-bold font-mono text-secondary">
                ₹{salesReport.summary?.total_tax_collected.toFixed(2)}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="text-xs text-on-surface-variant font-bold">DISCOUNTS & POINTS</div>
              <div className="text-3xl font-bold font-mono text-error">
                -₹{salesReport.summary?.total_discounts.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">pie_chart</span>
              Revenue Distribution by Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(salesReport.payment_breakdown || {}).map(([mode, amt]) => (
                <div key={mode} className="flex justify-between items-center p-4 rounded-lg border border-outline-variant bg-surface-container-low">
                  <span className="font-bold text-sm text-on-surface">{mode}</span>
                  <span className="font-mono font-bold text-base text-primary">₹{amt.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP DISHES */}
      {activeTab === 'TOP_DISHES' && (
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
            Dish Sales Performance Ranking
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container">
                <tr>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Rank</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Dish Name</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Total Quantity Sold</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topDishes.map((dish, idx) => (
                  <tr key={idx} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                    <td className="p-3 font-mono font-bold text-secondary">#{idx + 1}</td>
                    <td className="p-3 font-bold text-sm text-on-surface">{dish.dish_name}</td>
                    <td className="p-3 font-mono text-sm">{dish.total_qty_sold} servings</td>
                    <td className="p-3 font-mono font-bold text-sm text-on-tertiary-container">₹{dish.gross_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK VALUATION & WASTAGE */}
      {activeTab === 'STOCK_VALUATION' && stockValuation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="text-xs text-on-surface-variant font-bold">TOTAL INVENTORY ASSET VALUATION</div>
              <div className="text-3xl font-bold font-mono text-primary">₹{stockValuation.total_stock_asset_value.toFixed(2)}</div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="text-xs text-on-surface-variant font-bold">TOTAL WASTAGE COST LOSS</div>
              <div className="text-3xl font-bold font-mono text-error">₹{stockValuation.total_wastage_cost_loss.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-error border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">report</span>
              Detailed Stock Wastage Financial Loss Log
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container">
                  <tr>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Timestamp</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Ingredient</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Qty Lost</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Cost Loss</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {stockValuation.wastage_details?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-on-surface-variant">No stock wastage logged.</td>
                    </tr>
                  ) : (
                    stockValuation.wastage_details?.map((w, idx) => (
                      <tr key={idx} className="border-b border-outline-variant hover:bg-surface-container-low text-xs">
                        <td className="p-3 font-mono text-on-surface-variant">{new Date(w.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold text-on-surface">{w.ingredient}</td>
                        <td className="p-3 font-mono font-bold">{w.quantity_lost} {w.unit}</td>
                        <td className="p-3 font-mono font-bold text-error">₹{w.cost_loss.toFixed(2)}</td>
                        <td className="p-3 text-on-surface-variant">{w.notes}</td>
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
