import React, { useState, useEffect } from 'react';
import {
  fetchInventoryItems,
  fetchMenuItemsWithRecipes,
  processStockPurchase,
  recordStockWastage,
  fetchStockTransactions,
  addRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient
} from '../api/client';
import { Package, BookOpen, Truck, AlertTriangle, FileText, PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function InventoryView() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('RAW_MATERIALS'); // RAW_MATERIALS, RECIPES, PURCHASE, WASTAGE, AUDIT_LOG

  // Purchase Form State
  const [purchaseItemId, setPurchaseItemId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Wastage Form State
  const [wastageItemId, setWastageItemId] = useState('');
  const [wastageQty, setWastageQty] = useState('');
  const [wastageReason, setWastageReason] = useState('');

  // Recipe Modal State
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
  const [recipeQty, setRecipeQty] = useState('');
  const [recipeUnit, setRecipeUnit] = useState('g');
  const [recipeYieldFactor, setRecipeYieldFactor] = useState(1.0);

  const [editingRecipe, setEditingRecipe] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const inv = await fetchInventoryItems();
      const mi = await fetchMenuItemsWithRecipes();
      const tx = await fetchStockTransactions();
      setInventoryItems(inv);
      setMenuItems(mi);
      setTransactions(tx);
      if (inv.length > 0) {
        if (!purchaseItemId) setPurchaseItemId(inv[0].id);
        if (!wastageItemId) setWastageItemId(inv[0].id);
        if (!selectedInventoryItemId) setSelectedInventoryItemId(inv[0].id);
      }
      if (mi.length > 0 && !selectedMenuItemId) {
        setSelectedMenuItemId(mi[0].id);
      }
    } catch (err) {
      console.error("Error loading inventory data:", err);
    }
  };

  const handleAddRecipeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMenuItemId || !selectedInventoryItemId || !recipeQty) return;
    try {
      if (editingRecipe) {
        await updateRecipeIngredient(editingRecipe.id, {
          quantity_required: parseFloat(recipeQty),
          unit: recipeUnit,
          yield_factor: parseFloat(recipeYieldFactor)
        });
        alert("Recipe ingredient updated successfully!");
      } else {
        await addRecipeIngredient({
          menu_item_id: parseInt(selectedMenuItemId),
          inventory_item_id: parseInt(selectedInventoryItemId),
          quantity_required: parseFloat(recipeQty),
          unit: recipeUnit,
          yield_factor: parseFloat(recipeYieldFactor)
        });
        alert("Ingredient added to recipe successfully!");
      }
      setShowAddRecipeModal(false);
      setEditingRecipe(null);
      setRecipeQty('');
      loadData();
    } catch (err) {
      alert("Recipe Save Error: " + err.message);
    }
  };

  const handleEditRecipeClick = (recipe) => {
    setEditingRecipe(recipe);
    setSelectedMenuItemId(recipe.menu_item_id);
    setSelectedInventoryItemId(recipe.inventory_item_id);
    setRecipeQty(recipe.quantity_required);
    setRecipeUnit(recipe.unit);
    setRecipeYieldFactor(recipe.yield_factor || 1.0);
    setShowAddRecipeModal(true);
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm("Delete this ingredient mapping from recipe?")) return;
    try {
      await deleteRecipeIngredient(recipeId);
      loadData();
    } catch (err) {
      alert("Delete Recipe Error: " + err.message);
    }
  };


  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseItemId || !purchaseQty) return;
    try {
      await processStockPurchase(purchaseItemId, parseFloat(purchaseQty), purchaseNotes);
      setPurchaseQty('');
      setPurchaseNotes('');
      alert("Stock purchase logged successfully!");
      loadData();
    } catch (err) {
      alert("Error logging purchase: " + err.message);
    }
  };

  const handleWastageSubmit = async (e) => {
    e.preventDefault();
    if (!wastageItemId || !wastageQty) return;
    try {
      await recordStockWastage(wastageItemId, parseFloat(wastageQty), wastageReason);
      setWastageQty('');
      setWastageReason('');
      alert("Wastage logged successfully!");
      loadData();
    } catch (err) {
      alert("Error logging wastage: " + err.message);
    }
  };

  return (
    <div>
      {/* Sub Navigation Bar for Inventory Engine */}
      <div className="wf-panel" style={{ padding: '12px 20px', marginBottom: '20px' }}>
        <div className="flex-between">
          <span className="wf-title"><Package size={20} /> Inventory & Recipe Engine Management</span>
          <div className="flex-gap-8">
            <button
              className={`wf-btn ${activeTab === 'RAW_MATERIALS' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
              onClick={() => setActiveTab('RAW_MATERIALS')}
            >
              <Package size={16} /> Raw Materials Stock
            </button>
            <button
              className={`wf-btn ${activeTab === 'RECIPES' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
              onClick={() => setActiveTab('RECIPES')}
            >
              <BookOpen size={16} /> Menu Recipes Mapping
            </button>
            <button
              className={`wf-btn ${activeTab === 'PURCHASE' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
              onClick={() => setActiveTab('PURCHASE')}
            >
              <Truck size={16} /> Purchase (Stock In)
            </button>
            <button
              className={`wf-btn ${activeTab === 'WASTAGE' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
              onClick={() => setActiveTab('WASTAGE')}
            >
              <AlertTriangle size={16} /> Wastage & Adjustments
            </button>
            <button
              className={`wf-btn ${activeTab === 'AUDIT_LOG' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
              onClick={() => setActiveTab('AUDIT_LOG')}
            >
              <FileText size={16} /> Movement Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: RAW MATERIALS INVENTORY */}
      {activeTab === 'RAW_MATERIALS' && (
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title">Raw Material Stock Control (PDF Section 1 & 9)</span>
            <span className="wf-badge wf-badge-info">{inventoryItems.length} Total Ingredients</span>
          </div>

          <div className="wf-table-container">
            <table className="wf-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ingredient Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Minimum Stock</th>
                  <th>Unit</th>
                  <th>Cost / Unit</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(item => {
                  const isLow = item.current_stock <= item.min_stock;
                  return (
                    <tr key={item.id} style={{ backgroundColor: isLow ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                      <td><span className="wf-badge wf-badge-info">{item.category}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: isLow ? 'var(--wf-danger)' : 'var(--wf-text-main)' }}>
                        {item.current_stock.toFixed(3)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--wf-text-muted)' }}>
                        {item.min_stock.toFixed(3)}
                      </td>
                      <td>{item.unit}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>₹{item.cost_price.toFixed(2)}</td>
                      <td>
                        <span className={`wf-badge ${isLow ? 'wf-badge-danger' : 'wf-badge-normal'}`}>
                          {isLow ? '⚠️ Low Stock Alert' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPE MAPPINGS */}
      {activeTab === 'RECIPES' && (
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title">Menu Item Recipe Mappings & Yield Control</span>
            <button className="wf-btn wf-btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setShowAddRecipeModal(true)}>
              <PlusCircle size={14} /> Add Ingredient to Recipe
            </button>
          </div>

          <div className="wf-card-grid">
            {menuItems.map(item => (
              <div key={item.id} className="wf-card">
                <div className="flex-between" style={{ marginBottom: '8px', borderBottom: '1px solid var(--wf-border)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--wf-accent)' }}>{item.name}</h4>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>₹{item.price}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', marginBottom: '8px' }}>
                  Required Raw Material Ingredients per 1 Serving:
                </div>
                <div style={{ background: 'var(--wf-panel-bg)', padding: '8px', borderRadius: '4px', border: '1px dashed var(--wf-border-dashed)' }}>
                  {item.recipes && item.recipes.length > 0 ? (
                    item.recipes.map((r, idx) => (
                      <div key={idx} className="flex-between" style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: idx < item.recipes.length - 1 ? '1px solid var(--wf-border)' : 'none' }}>
                        <div>
                          <strong style={{ color: 'var(--wf-text-main)' }}>{r.inventory_item_name || `Item #${r.inventory_item_id}`}</strong>
                          <span style={{ color: 'var(--wf-warning)', fontWeight: 'bold', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                            {r.quantity_required} {r.unit}
                          </span>
                          {r.yield_factor && r.yield_factor !== 1.0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--wf-accent)', marginLeft: '4px' }}>
                              (Yield Loss: {((r.yield_factor - 1) * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            style={{ background: 'none', border: 'none', color: 'var(--wf-accent)', cursor: 'pointer', fontSize: '0.75rem' }}
                            onClick={() => handleEditRecipeClick(r)}
                          >
                            Edit
                          </button>
                          <button
                            style={{ background: 'none', border: 'none', color: 'var(--wf-danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteRecipe(r.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)' }}>No recipe ingredients linked yet.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* TAB 3: PURCHASE IN */}
      {activeTab === 'PURCHASE' && (
        <div className="wf-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="wf-panel-header">
            <span className="wf-title"><Truck size={18} /> Record Purchase / Stock In (PDF Section 7)</span>
          </div>
          <form onSubmit={handlePurchaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Select Ingredient:</label>
              <select
                className="wf-input"
                value={purchaseItemId}
                onChange={(e) => setPurchaseItemId(e.target.value)}
              >
                {inventoryItems.map(i => (
                  <option key={i.id} value={i.id}>{i.name} (Current: {i.current_stock} {i.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Purchased Quantity (In Ingredient Units):</label>
              <input
                type="number"
                step="0.001"
                className="wf-input"
                placeholder="e.g. 5.0"
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Supplier / Invoice Notes:</label>
              <input
                type="text"
                className="wf-input"
                placeholder="e.g. Purchase #101 - Dairy Supplier"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
              />
            </div>
            <button type="submit" className="wf-btn wf-btn-primary" style={{ justifyContent: 'center', padding: '12px' }}>
              <PlusCircle size={16} /> Save Purchase & Increase Stock
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: WASTAGE */}
      {activeTab === 'WASTAGE' && (
        <div className="wf-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="wf-panel-header">
            <span className="wf-title" style={{ color: 'var(--wf-danger)' }}>
              <AlertTriangle size={18} /> Record Wastage / Expiration (PDF Section 8)
            </span>
          </div>
          <form onSubmit={handleWastageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Select Ingredient:</label>
              <select
                className="wf-input"
                value={wastageItemId}
                onChange={(e) => setWastageItemId(e.target.value)}
              >
                {inventoryItems.map(i => (
                  <option key={i.id} value={i.id}>{i.name} (Current: {i.current_stock} {i.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Wastage Quantity:</label>
              <input
                type="number"
                step="0.001"
                className="wf-input"
                placeholder="e.g. 0.5"
                value={wastageQty}
                onChange={(e) => setWastageQty(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Reason for Wastage:</label>
              <input
                type="text"
                className="wf-input"
                placeholder="e.g. Expired / Spoilage"
                value={wastageReason}
                onChange={(e) => setWastageReason(e.target.value)}
              />
            </div>
            <button type="submit" className="wf-btn" style={{ justifyContent: 'center', padding: '12px', borderColor: 'var(--wf-danger)', color: 'var(--wf-danger)' }}>
              Deduct Stock & Log Wastage Audit Record
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: MOVEMENT AUDIT TRAIL LOG */}
      {activeTab === 'AUDIT_LOG' && (
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title">Stock Movement Log Audit Trail (PDF Section 6)</span>
            <span className="wf-badge wf-badge-info">{transactions.length} Total Audit Records</span>
          </div>

          <div className="wf-table-container">
            <table className="wf-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Ingredient</th>
                  <th>Type</th>
                  <th>Quantity (+/-)</th>
                  <th>Reference ID</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--wf-text-muted)' }}>No stock movement logs recorded yet.</td>
                  </tr>
                ) : (
                  transactions.map(tx => {
                    const isPositive = tx.quantity > 0;
                    return (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{tx.inventory_item_name}</td>
                        <td>
                          <span className={`wf-badge ${
                            tx.transaction_type === 'PURCHASE' ? 'wf-badge-normal' :
                            tx.transaction_type === 'SALE_DEDUCTION' ? 'wf-badge-info' : 'wf-badge-danger'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: isPositive ? 'var(--wf-success)' : 'var(--wf-danger)' }}>
                          {isPositive ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{tx.reference_id}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>{tx.notes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Recipe Modal */}
      {showAddRecipeModal && (
        <div className="wf-modal-overlay">
          <div className="wf-modal-card" style={{ maxWidth: '420px' }}>
            <h4>{editingRecipe ? 'Edit Recipe Ingredient' : 'Add Ingredient to Recipe'}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginBottom: '12px' }}>
              Map raw stock ingredient requirement to dish menu item:
            </p>
            <form onSubmit={handleAddRecipeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!editingRecipe && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '2px' }}>Menu Item:</label>
                  <select className="wf-input" value={selectedMenuItemId} onChange={(e) => setSelectedMenuItemId(e.target.value)}>
                    {menuItems.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '2px' }}>Raw Ingredient:</label>
                <select className="wf-input" value={selectedInventoryItemId} onChange={(e) => setSelectedInventoryItemId(e.target.value)} disabled={!!editingRecipe}>
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Stock Unit: {i.unit})</option>
                  ))}
                </select>
              </div>

              <div className="flex-gap-8">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '2px' }}>Required Quantity:</label>
                  <input type="number" step="0.001" className="wf-input" value={recipeQty} onChange={(e) => setRecipeQty(e.target.value)} placeholder="e.g. 200" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '2px' }}>Recipe Unit:</label>
                  <select className="wf-input" value={recipeUnit} onChange={(e) => setRecipeUnit(e.target.value)}>
                    <option value="g">g (Grams)</option>
                    <option value="Kg">Kg (Kilograms)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="Litre">Litre</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Dozen">Dozen</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '2px' }}>
                  Yield Loss Multiplier Factor (e.g. 1.1 for 10% prep loss):
                </label>
                <input type="number" step="0.01" className="wf-input" value={recipeYieldFactor} onChange={(e) => setRecipeYieldFactor(e.target.value)} placeholder="1.0" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="wf-btn wf-btn-secondary" onClick={() => { setShowAddRecipeModal(false); setEditingRecipe(null); }}>Cancel</button>
                <button type="submit" className="wf-btn wf-btn-primary">Save Recipe Ingredient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

