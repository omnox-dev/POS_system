const API_BASE = '/api';

// Auth API
export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

// Kiosk API
export async function fetchKioskMenu() {
  const res = await fetch(`${API_BASE}/kiosk/menu`);
  return res.json();
}

export async function fetchKioskTables() {
  const res = await fetch(`${API_BASE}/kiosk/tables`);
  return res.json();
}

export async function placeKioskOrder(orderData) {
  const res = await fetch(`${API_BASE}/kiosk/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return res.json();
}

// POS & Order Extensions API
export async function fetchPosTables() {
  const res = await fetch(`${API_BASE}/pos/tables`);
  return res.json();
}

export async function fetchPosOrders(status = null) {
  const url = status ? `${API_BASE}/pos/orders?status=${status}` : `${API_BASE}/pos/orders`;
  const res = await fetch(url);
  return res.json();
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${API_BASE}/pos/orders/${orderId}/status?status=${status}`, {
    method: 'PATCH'
  });
  return res.json();
}

export async function appendItemsToOrder(orderId, items) {
  const res = await fetch(`${API_BASE}/pos/orders/${orderId}/append-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });
  return res.json();
}

export async function transferTable(orderId, targetTableId) {
  const res = await fetch(`${API_BASE}/pos/orders/${orderId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_table_id: targetTableId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Transfer failed');
  }
  return res.json();
}

export async function voidOrderItem(orderId, orderItemId, reason) {
  const res = await fetch(`${API_BASE}/pos/orders/${orderId}/void-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_item_id: orderItemId, reason })
  });
  return res.json();
}

export async function simulateDigitalPayment(orderId, provider, amount) {
  const res = await fetch(`${API_BASE}/pos/orders/${orderId}/pay-digital`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_provider: provider, amount })
  });
  return res.json();
}

export async function lookupCustomerLoyalty(phone) {
  const res = await fetch(`${API_BASE}/pos/customers/${phone}`);
  if (!res.ok) return null;
  return res.json();
}

export async function processOrderBill(orderId, billingData) {
  const res = await fetch(`${API_BASE}/pos/orders/${orderId}/bill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(billingData)
  });
  return res.json();
}

export async function splitOrderBill(orderId, splitCount) {
  const res = await fetch(`${API_BASE}/pos/orders/${orderId}/split?split_count=${splitCount}`, {
    method: 'POST'
  });
  return res.json();
}

// Inventory & Recipe CRUD API
export async function fetchInventoryItems() {
  const res = await fetch(`${API_BASE}/inventory/items`);
  return res.json();
}

export async function addInventoryItem(itemData) {
  const res = await fetch(`${API_BASE}/inventory/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  });
  return res.json();
}

export async function fetchMenuItemsWithRecipes() {
  const res = await fetch(`${API_BASE}/inventory/menu-items`);
  return res.json();
}

export async function addRecipeIngredient(recipeData) {
  const res = await fetch(`${API_BASE}/inventory/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  });
  return res.json();
}

export async function updateRecipeIngredient(recipeId, recipeData) {
  const res = await fetch(`${API_BASE}/inventory/recipes/${recipeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  });
  return res.json();
}

export async function deleteRecipeIngredient(recipeId) {
  const res = await fetch(`${API_BASE}/inventory/recipes/${recipeId}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function processStockPurchase(itemId, quantity, notes) {
  const res = await fetch(`${API_BASE}/inventory/purchase?item_id=${itemId}&quantity=${quantity}&notes=${encodeURIComponent(notes || '')}`, {
    method: 'POST'
  });
  return res.json();
}

export async function recordStockWastage(itemId, quantity, reason) {
  const res = await fetch(`${API_BASE}/inventory/wastage?item_id=${itemId}&quantity=${quantity}&reason=${encodeURIComponent(reason || '')}`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchStockTransactions() {
  const res = await fetch(`${API_BASE}/inventory/transactions`);
  return res.json();
}

export async function fetchDashboardMetrics() {
  const res = await fetch(`${API_BASE}/dashboard/metrics`);
  return res.json();
}

// Reports & Analytics API
export async function fetchSalesReport() {
  const res = await fetch(`${API_BASE}/reports/sales`);
  return res.json();
}

export async function fetchTopDishesReport() {
  const res = await fetch(`${API_BASE}/reports/top-dishes`);
  return res.json();
}

export async function fetchStockValuationReport() {
  const res = await fetch(`${API_BASE}/reports/stock-valuation`);
  return res.json();
}


