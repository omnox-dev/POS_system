import React, { useState, useEffect } from 'react';
import {
  fetchInventoryItems,
  fetchMenuItemsWithRecipes,
  addRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,
  processStockPurchase,
  recordStockWastage,
  fetchStockTransactions
} from '../api/client';

export default function InventoryView() {
  const [activeTab, setActiveTab] = useState('RAW_MATERIALS'); // RAW_MATERIALS, RECIPES, PURCHASE, WASTAGE, TRANSACTIONS
  const [inventoryItems, setInventoryItems] = useState([]);
  const [menuItemsWithRecipes, setMenuItemsWithRecipes] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Modal State for Recipe Ingredient Add/Edit
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeModalMode, setRecipeModalMode] = useState('ADD'); // ADD or EDIT
  const [targetRecipeId, setTargetRecipeId] = useState(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
  const [quantityRequired, setQuantityRequired] = useState('');
  const [recipeUnit, setRecipeUnit] = useState('g');
  const [yieldFactor, setYieldFactor] = useState(1.0);

  // Purchase Form State
  const [purchaseItemId, setPurchaseItemId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Wastage Form State
  const [wastageItemId, setWastageItemId] = useState('');
  const [wastageQty, setWastageQty] = useState('');
  const [wastageReason, setWastageReason] = useState('');

  // Add Raw Material Ingredient Modal State
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState('Dairy');
  const [ingUnit, setIngUnit] = useState('kg');
  const [ingCurrentStock, setIngCurrentStock] = useState('10.0');
  const [ingMinStock, setIngMinStock] = useState('2.0');
  const [ingCostPrice, setIngCostPrice] = useState('100.0');

  // Add New Dish Recipe Modal State
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');

  const handleCreateIngredientSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ingName,
          category: ingCategory,
          unit: ingUnit,
          current_stock: parseFloat(ingCurrentStock) || 0.0,
          min_stock: parseFloat(ingMinStock) || 0.0,
          cost_price: parseFloat(ingCostPrice) || 0.0,
          status: parseFloat(ingCurrentStock) <= parseFloat(ingMinStock) ? 'Low Stock' : 'Normal'
        })
      });
      setShowAddIngredientModal(false);
      setIngName('');
      loadData();
      alert(`Raw material "${ingName}" added successfully!`);
    } catch (err) {
      alert("Error adding ingredient: " + err.message);
    }
  };

  const handleCreateDishSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/inventory/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dishName,
          category: dishCategory,
          price: parseFloat(dishPrice) || 0.0,
          description: dishDescription,
          image_url: dishImageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
          is_available: true
        })
      });
      setShowAddDishModal(false);
      setDishName('');
      setDishPrice('');
      setDishDescription('');
      loadData();
      alert(`Dish "${dishName}" created & published to Atithi Kiosk and POS menu!`);
    } catch (err) {
      alert("Error creating dish recipe: " + err.message);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const inv = await fetchInventoryItems();
      const menu = await fetchMenuItemsWithRecipes();
      const txs = await fetchStockTransactions();
      setInventoryItems(inv);
      setMenuItemsWithRecipes(menu);
      setTransactions(txs);
      if (inv.length > 0) {
        setPurchaseItemId(inv[0].id);
        setWastageItemId(inv[0].id);
        setSelectedInventoryItemId(inv[0].id);
      }
      if (menu.length > 0) {
        setSelectedMenuItemId(menu[0].id);
      }
    } catch (err) {
      console.error("Error loading inventory data:", err);
    }
  };

  const handleOpenAddRecipeModal = (menuItemId) => {
    setRecipeModalMode('ADD');
    setSelectedMenuItemId(menuItemId);
    setQuantityRequired('');
    setRecipeUnit('g');
    setYieldFactor(1.0);
    setShowRecipeModal(true);
  };

  const handleOpenEditRecipeModal = (recipe, menuItemId) => {
    setRecipeModalMode('EDIT');
    setTargetRecipeId(recipe.id);
    setSelectedMenuItemId(menuItemId);
    setSelectedInventoryItemId(recipe.inventory_item_id);
    setQuantityRequired(recipe.quantity_required);
    setRecipeUnit(recipe.unit);
    setYieldFactor(recipe.yield_factor || 1.0);
    setShowRecipeModal(true);
  };

  const handleSaveRecipeIngredient = async (e) => {
    e.preventDefault();
    try {
      if (recipeModalMode === 'ADD') {
        await addRecipeIngredient({
          menu_item_id: parseInt(selectedMenuItemId),
          inventory_item_id: parseInt(selectedInventoryItemId),
          quantity_required: parseFloat(quantityRequired),
          unit: recipeUnit,
          yield_factor: parseFloat(yieldFactor) || 1.0
        });
      } else {
        await updateRecipeIngredient(targetRecipeId, {
          quantity_required: parseFloat(quantityRequired),
          unit: recipeUnit,
          yield_factor: parseFloat(yieldFactor) || 1.0
        });
      }
      setShowRecipeModal(false);
      loadData();
    } catch (err) {
      alert("Error saving recipe ingredient: " + err.message);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm("Are you sure you want to remove this ingredient from the dish recipe?")) return;
    try {
      await deleteRecipeIngredient(recipeId);
      loadData();
    } catch (err) {
      alert("Error deleting recipe ingredient: " + err.message);
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseItemId || !purchaseQty) return;
    try {
      await processStockPurchase(parseInt(purchaseItemId), parseFloat(purchaseQty), purchaseNotes);
      setPurchaseQty('');
      setPurchaseNotes('');
      loadData();
      alert("Stock purchase processed successfully!");
    } catch (err) {
      alert("Error recording purchase: " + err.message);
    }
  };

  const handleWastageSubmit = async (e) => {
    e.preventDefault();
    if (!wastageItemId || !wastageQty) return;
    try {
      await recordStockWastage(parseInt(wastageItemId), parseFloat(wastageQty), wastageReason);
      setWastageQty('');
      setWastageReason('');
      loadData();
      alert("Stock wastage recorded successfully!");
    } catch (err) {
      alert("Error recording wastage: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full bg-background rounded-xl border border-outline-variant overflow-hidden shadow-lg">
      {/* Top Header & Sub-Tab Navigation Bar */}
      <header className="bg-surface-container-lowest border-b border-outline-variant px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary">inventory_2</span>
          <div>
            <h1 className="font-bold text-xl text-primary">Rajgad Royal Inventory & Recipes</h1>
            <p className="text-xs text-on-surface-variant">Automated Stock Control, Recipe Engine & Unit Conversion</p>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center bg-surface-container-high p-1 rounded-lg gap-1 border border-outline-variant">
          <button
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'RAW_MATERIALS' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('RAW_MATERIALS')}
          >
            Raw Materials Stock
          </button>
          <button
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'RECIPES' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('RECIPES')}
          >
            Recipes & Yield Mappings
          </button>
          <button
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'PURCHASE' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('PURCHASE')}
          >
            Stock In (Purchase)
          </button>
          <button
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'WASTAGE' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('WASTAGE')}
          >
            Record Wastage
          </button>
          <button
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'TRANSACTIONS' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('TRANSACTIONS')}
          >
            Audit Log
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 bg-surface-container-low">
        {/* TAB 1: RAW MATERIALS STOCK TABLE */}
        {activeTab === 'RAW_MATERIALS' && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-lg text-on-surface">Raw Material Ingredients Stock</h2>
                <p className="text-xs text-on-surface-variant">Master raw ingredients inventory for recipe deductions</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  {inventoryItems.length} Ingredients Registered
                </span>
                <button
                  className="bg-secondary text-on-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-secondary-container hover:text-on-secondary-container transition-all shadow-sm flex items-center gap-1"
                  onClick={() => setShowAddIngredientModal(true)}
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  + Add New Raw Ingredient
                </button>
              </div>
            </div>


            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container">
                  <tr>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">ID</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Ingredient Name</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Category</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Current Stock</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Min Stock Limit</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Unit Cost</th>
                    <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map(item => {
                    const isLow = item.current_stock <= item.min_stock;
                    return (
                      <tr key={item.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                        <td className="p-3 font-mono text-xs font-bold text-primary">#{item.id}</td>
                        <td className="p-3 font-bold text-sm text-on-surface">{item.name}</td>
                        <td className="p-3 text-xs text-on-surface-variant">{item.category}</td>
                        <td className="p-3 font-mono font-bold text-sm">{item.current_stock.toFixed(2)} {item.unit}</td>
                        <td className="p-3 font-mono text-xs text-on-surface-variant">{item.min_stock.toFixed(2)} {item.unit}</td>
                        <td className="p-3 font-mono text-xs font-bold text-on-surface">₹{item.cost_price.toFixed(2)} / {item.unit}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            isLow ? 'bg-error-container text-on-error-container border border-error' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                          }`}>
                            <span className="material-symbols-outlined text-xs">{isLow ? 'warning' : 'check_circle'}</span>
                            {isLow ? 'LOW STOCK' : 'Normal'}
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

        {/* TAB 2: RECIPES & YIELD MAPPINGS */}
        {activeTab === 'RECIPES' && (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold text-lg text-on-surface">Dish Recipe & Yield Loss Mappings</h2>
                  <p className="text-xs text-on-surface-variant">Smart Engine automatically converts recipe units (g, ml) to stock units (Kg, L) with prep yield factors.</p>
                </div>
                <button
                  className="bg-primary text-on-primary px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-1"
                  onClick={() => setShowAddDishModal(true)}
                >
                  <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                  + Create New Dish & Link Recipe
                </button>
              </div>


              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {menuItemsWithRecipes.map(dish => (
                  <div key={dish.id} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                      <div>
                        <h3 className="font-bold text-base text-primary">{dish.name}</h3>
                        <span className="text-xs text-on-surface-variant">{dish.category} — ₹{dish.price.toFixed(2)}</span>
                      </div>
                      <button
                        className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container flex items-center gap-1"
                        onClick={() => handleOpenAddRecipeModal(dish.id)}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Ingredient
                      </button>
                    </div>

                    <div className="space-y-2">
                      {dish.recipes?.length === 0 ? (
                        <div className="text-xs text-on-surface-variant italic p-2">No ingredients mapped yet.</div>
                      ) : (
                        dish.recipes?.map(r => (
                          <div key={r.id} className="flex justify-between items-center bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant text-xs">
                            <div>
                              <span className="font-bold text-on-surface">{r.inventory_item_name}</span>
                              <span className="font-mono text-primary font-bold ml-2">{r.quantity_required} {r.unit}</span>
                              {r.yield_factor && r.yield_factor !== 1.0 && (
                                <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-1.5 py-0.5 rounded text-[10px] font-bold ml-2">
                                  Yield Factor: {r.yield_factor}x
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="text-on-surface-variant hover:text-primary" title="Edit" onClick={() => handleOpenEditRecipeModal(r, dish.id)}>
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button className="text-outline hover:text-error" title="Delete" onClick={() => handleDeleteRecipe(r.id)}>
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PURCHASE ENTRY */}
        {activeTab === 'PURCHASE' && (
          <div className="max-w-xl mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <h2 className="font-bold text-lg text-on-surface mb-1">Record Supplier Stock Purchase (Stock In)</h2>
            <p className="text-xs text-on-surface-variant mb-4">Adds raw stock quantity into database and logs purchase invoice transaction.</p>
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Select Ingredient:</label>
                <select
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm bg-surface font-mono"
                  value={purchaseItemId}
                  onChange={(e) => setPurchaseItemId(e.target.value)}
                  required
                >
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Current: {i.current_stock} {i.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Purchased Quantity to Add:</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm bg-surface font-mono"
                  placeholder="e.g. 50"
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Supplier Notes / Invoice No:</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm bg-surface"
                  placeholder="e.g. Invoice #INV-8890 from Dairy Supplier"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-bold text-sm hover:bg-secondary-container hover:text-on-secondary-container">
                Process Stock Purchase & Update Stock
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: RECORD WASTAGE */}
        {activeTab === 'WASTAGE' && (
          <div className="max-w-xl mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <h2 className="font-bold text-lg text-error mb-1">Record Stock Wastage & Spoilage Loss</h2>
            <p className="text-xs text-on-surface-variant mb-4">Deducts inventory stock for kitchen spoilage/expiration and logs financial cost loss.</p>
            <form onSubmit={handleWastageSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Select Spoiled Ingredient:</label>
                <select
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm bg-surface font-mono"
                  value={wastageItemId}
                  onChange={(e) => setWastageItemId(e.target.value)}
                  required
                >
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Current: {i.current_stock} {i.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Quantity Lost:</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm bg-surface font-mono"
                  placeholder="e.g. 2.5"
                  value={wastageQty}
                  onChange={(e) => setWastageQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Wastage Reason / Notes:</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm bg-surface"
                  placeholder="e.g. Expired shelf life / Spoilage in fridge"
                  value={wastageReason}
                  onChange={(e) => setWastageReason(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="w-full py-3 bg-error text-on-error rounded-lg font-bold text-sm hover:opacity-90">
                Deduct Stock & Log Financial Loss
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: TRANSACTIONS AUDIT LOG (ENCLOSED ORDER NUMBER BLOCKS) */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
              <div>
                <h2 className="font-bold text-lg text-on-surface">Stock Movement Audit Log</h2>
                <p className="text-xs text-on-surface-variant">Enclosed Order Number & Transaction Reference Blocks</p>
              </div>
              <span className="bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-full">
                {Object.keys(
                  transactions.reduce((acc, tx) => {
                    const ref = tx.reference_id || 'GENERAL_LOG';
                    acc[ref] = true;
                    return acc;
                  }, {})
                ).length} Transaction Blocks
              </span>
            </div>

            {/* Render Enclosed Blocks */}
            {Object.values(
              transactions.reduce((acc, tx) => {
                const ref = tx.reference_id || 'GENERAL_LOG';
                if (!acc[ref]) {
                  acc[ref] = {
                    reference_id: ref,
                    type: tx.transaction_type,
                    timestamp: tx.timestamp,
                    items: []
                  };
                }
                acc[ref].items.push(tx);
                return acc;
              }, {})
            ).map((group, idx) => {
              const isOrder = group.reference_id.startsWith('ORD');
              const isPurchase = group.type === 'PURCHASE';
              const isWastage = group.type === 'WASTAGE';

              return (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-2xl border-2 border-outline-variant/80 p-5 shadow-sm space-y-3"
                >
                  {/* Block Header */}
                  <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                        isOrder
                          ? 'bg-secondary-container text-on-secondary-container border border-secondary-fixed'
                          : isPurchase
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        <span className="material-symbols-outlined text-xl">
                          {isOrder ? 'receipt_long' : isPurchase ? 'local_shipping' : 'delete_sweep'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-primary font-mono">{group.reference_id}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPurchase
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                              : isWastage
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-secondary-container text-on-secondary-container border border-secondary-fixed'
                          }`}>
                            {group.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          Recorded on: {new Date(group.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-lg text-xs font-mono font-bold border border-outline-variant/60">
                      {group.items.length} {group.items.length === 1 ? 'Ingredient Movement' : 'Ingredients Movements'}
                    </span>
                  </div>

                  {/* Enclosed Items Table */}
                  <div className="overflow-x-auto border border-outline-variant/60 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container">
                        <tr>
                          <th className="p-2.5 font-bold text-on-surface-variant border-b border-outline-variant">Raw Ingredient</th>
                          <th className="p-2.5 font-bold text-on-surface-variant border-b border-outline-variant text-right">Quantity Delta</th>
                          <th className="p-2.5 font-bold text-on-surface-variant border-b border-outline-variant">Movement Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((tx, itemIdx) => (
                          <tr key={itemIdx} className="border-b border-outline-variant/40 hover:bg-surface-container-low">
                            <td className="p-2.5 font-bold text-on-surface">{tx.inventory_item_name}</td>
                            <td className={`p-2.5 text-right font-mono font-bold ${tx.quantity > 0 ? 'text-tertiary' : 'text-error'}`}>
                              {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                            </td>
                            <td className="p-2.5 text-on-surface-variant font-mono text-[11px]">{tx.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Recipe Add/Edit Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 max-w-md w-full shadow-2xl">
            <h4 className="font-bold text-lg mb-1">{recipeModalMode === 'ADD' ? 'Add Ingredient to Recipe' : 'Edit Recipe Ingredient'}</h4>
            <p className="text-xs text-on-surface-variant mb-4">Set required dish quantity, recipe unit, and yield loss factor.</p>

            <form onSubmit={handleSaveRecipeIngredient} className="space-y-3 text-xs">
              {recipeModalMode === 'ADD' && (
                <div>
                  <label className="font-bold block mb-1">Select Ingredient:</label>
                  <select
                    className="w-full p-2 border border-outline-variant rounded bg-surface font-mono"
                    value={selectedInventoryItemId}
                    onChange={(e) => setSelectedInventoryItemId(e.target.value)}
                  >
                    {inventoryItems.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">Quantity Required per Serving:</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border border-outline-variant rounded bg-surface font-mono"
                  placeholder="e.g. 200"
                  value={quantityRequired}
                  onChange={(e) => setQuantityRequired(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Recipe Unit:</label>
                <select
                  className="w-full p-2 border border-outline-variant rounded bg-surface font-mono"
                  value={recipeUnit}
                  onChange={(e) => setRecipeUnit(e.target.value)}
                >
                  <option value="g">Grams (g)</option>
                  <option value="Kg">Kilograms (Kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="Litre">Liters (L)</option>
                  <option value="Pcs">Pieces (Pcs)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Yield Loss Factor (e.g. 1.05 for 5% prep trim loss):</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border border-outline-variant rounded bg-surface font-mono"
                  value={yieldFactor}
                  onChange={(e) => setYieldFactor(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 bg-surface-container-highest rounded text-xs font-bold" onClick={() => setShowRecipeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded text-xs font-bold">
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal 2: Add New Raw Material Ingredient Form */}

      {showAddIngredientModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl border-2 border-outline-variant p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">add_circle</span>
                Add New Raw Material Ingredient
              </h3>
              <button className="text-on-surface-variant hover:text-error" onClick={() => setShowAddIngredientModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateIngredientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">Ingredient Name:</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface focus:border-primary outline-none"
                  placeholder="e.g. Basmati Rice, Amul Ghee, Paneer"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-on-surface block mb-1">Category:</label>
                  <select
                    className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface"
                    value={ingCategory}
                    onChange={(e) => setIngCategory(e.target.value)}
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Meat">Meat & Poultry</option>
                    <option value="Spices">Spices & Seasoning</option>
                    <option value="Grains">Grains & Pulses</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">Unit of Measure:</label>
                  <select
                    className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface font-mono"
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="L">Liters (L)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="g">Grams (g)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-on-surface block mb-1">Initial Stock:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface font-mono"
                    value={ingCurrentStock}
                    onChange={(e) => setIngCurrentStock(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">Min Threshold:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface font-mono"
                    value={ingMinStock}
                    onChange={(e) => setIngMinStock(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">Cost Per Unit (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface font-mono"
                    value={ingCostPrice}
                    onChange={(e) => setIngCostPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-xl font-bold"
                  onClick={() => setShowAddIngredientModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-sm"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create New Dish & Link Recipe Modal */}
      {showAddDishModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl border-2 border-outline-variant p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">restaurant_menu</span>
                Create New Dish & Publish to Kiosk
              </h3>
              <button className="text-on-surface-variant hover:text-error" onClick={() => setShowAddDishModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDishSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">Dish Name:</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface focus:border-primary outline-none"
                  placeholder="e.g. Special Chicken Biryani, Dal Makhani"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-on-surface block mb-1">Category:</label>
                  <select
                    className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface"
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Breads">Breads</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">Menu Price (₹):</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface font-mono"
                    placeholder="350.00"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Description:</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface"
                  placeholder="Aromatic long grain rice cooked with spices"
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Food Image URL (Optional):</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-outline-variant rounded-xl bg-surface font-mono text-[11px]"
                  placeholder="https://images.unsplash.com/..."
                  value={dishImageUrl}
                  onChange={(e) => setDishImageUrl(e.target.value)}
                />
              </div>

              <div className="bg-secondary-container/20 p-2.5 rounded-xl border border-secondary-fixed text-[11px] text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base shrink-0">info</span>
                <span>Creating this dish publishes it immediately to the Atithi Kiosk and Cashier POS menus.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-xl font-bold"
                  onClick={() => setShowAddDishModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container shadow-sm"
                >
                  Create & Publish Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

