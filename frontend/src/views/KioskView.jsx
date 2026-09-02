import React, { useState, useEffect } from 'react';
import { fetchKioskMenu, fetchKioskTables, placeKioskOrder } from '../api/client';
import { ShoppingBag, Plus, Minus, CheckCircle, CreditCard, QrCode, DollarSign } from 'lucide-react';

export default function KioskView() {
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [orderType, setOrderType] = useState('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [orderReceipt, setOrderReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const items = await fetchKioskMenu();
      const t = await fetchKioskTables();
      setMenuItems(items);
      setTables(t);
      if (t.length > 0) setSelectedTableId(t[0].id);
    } catch (err) {
      console.error("Error loading kiosk data:", err);
    }
  };

  const categories = ['ALL', ...new Set(menuItems.map(i => i.category))];

  const filteredItems = selectedCategory === 'ALL'
    ? menuItems
    : menuItems.filter(i => i.category === selectedCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menu_item_id === item.id);
      if (existing) {
        return prev.map(ci => ci.menu_item_id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (menu_item_id, delta) => {
    setCart(prev => prev.map(ci => {
      if (ci.menu_item_id === menu_item_id) {
        const newQty = ci.quantity + delta;
        return newQty > 0 ? { ...ci, quantity: newQty } : null;
      }
      return ci;
    }).filter(Boolean));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    const payload = {
      table_id: orderType === 'DINE_IN' && selectedTableId ? parseInt(selectedTableId) : null,
      order_type: orderType,
      customer_name: customerName || "Kiosk Guest",
      customer_phone: customerPhone || "N/A",
      items: cart.map(ci => ({
        menu_item_id: ci.menu_item_id,
        quantity: ci.quantity,
        notes: "Placed via Kiosk"
      }))
    };

    try {
      const receipt = await placeKioskOrder(payload);
      setOrderReceipt({ ...receipt, cartItems: [...cart], paymentMode });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      loadData();
    } catch (err) {
      alert("Error placing order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-grid-2">
      {/* Left Column: Menu Browsing Wireframe */}
      <div>
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title">📱 Self-Ordering Kiosk — Menu Frame</span>
            <div className="flex-gap-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`wf-btn ${selectedCategory === cat ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="wf-card-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="wf-card">
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span className="wf-badge wf-badge-info">{item.category}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>₹{item.price.toFixed(2)}</span>
                </div>
                <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>{item.name}</h4>
                <p style={{ color: 'var(--wf-text-muted)', fontSize: '0.8rem', marginBottom: '12px', height: '36px', overflow: 'hidden' }}>
                  {item.description}
                </p>
                <button
                  className="wf-btn wf-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => addToCart(item)}
                >
                  <Plus size={16} /> Add to Order
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary & Checkout Drawer */}
      <div>
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title"><ShoppingBag size={18} /> Cart & Checkout</span>
            <span className="wf-badge wf-badge-normal">{cart.length} Items</span>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--wf-text-muted)', border: '1px dashed var(--wf-border-dashed)', borderRadius: '6px' }}>
              Your cart is empty. Select items from the menu frame to build an order.
            </div>
          ) : (
            <div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
                {cart.map(ci => (
                  <div key={ci.menu_item_id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--wf-border)' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{ci.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ₹{ci.price} × {ci.quantity} = ₹{(ci.price * ci.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex-gap-8">
                      <button className="wf-btn" style={{ padding: '4px 8px' }} onClick={() => updateQuantity(ci.menu_item_id, -1)}><Minus size={14} /></button>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{ci.quantity}</span>
                      <button className="wf-btn" style={{ padding: '4px 8px' }} onClick={() => updateQuantity(ci.menu_item_id, 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', paddingTop: '12px', borderTop: '1px dashed var(--wf-border)' }}>
                <div className="flex-gap-8">
                  <button
                    className={`wf-btn ${orderType === 'DINE_IN' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setOrderType('DINE_IN')}
                  >
                    Dine-In
                  </button>
                  <button
                    className={`wf-btn ${orderType === 'TAKEAWAY' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setOrderType('TAKEAWAY')}
                  >
                    Takeaway
                  </button>
                </div>

                {orderType === 'DINE_IN' && (
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Select Table Number:</label>
                    <select
                      className="wf-input"
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.table_number} (Cap: {t.capacity}) — {t.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    className="wf-input"
                    placeholder="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                {/* Payment Selection */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '4px' }}>Select Payment Method:</label>
                  <div className="flex-gap-8">
                    <button
                      className={`wf-btn ${paymentMode === 'UPI' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                      onClick={() => setPaymentMode('UPI')}
                    >
                      <QrCode size={14} /> Instant UPI
                    </button>
                    <button
                      className={`wf-btn ${paymentMode === 'Card' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                      onClick={() => setPaymentMode('Card')}
                    >
                      <CreditCard size={14} /> Card
                    </button>
                    <button
                      className={`wf-btn ${paymentMode === 'Cash' ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                      onClick={() => setPaymentMode('Cash')}
                    >
                      <DollarSign size={14} /> Cash
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtotal & Checkout */}
              <div className="flex-between" style={{ padding: '12px 0', borderTop: '1px solid var(--wf-border)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>Total Amount:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--wf-accent)' }}>₹{cartSubtotal.toFixed(2)}</span>
              </div>

              <button
                className="wf-btn wf-btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '8px' }}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Dispatching Order..." : "Place Order & Generate KOT"}
              </button>
            </div>
          )}
        </div>

        {/* KOT Receipt Confirmation Modal / Box */}
        {orderReceipt && (
          <div className="wf-panel" style={{ borderColor: 'var(--wf-success)', marginTop: '20px' }}>
            <div className="wf-panel-header">
              <span className="wf-title" style={{ color: 'var(--wf-success)' }}>
                <CheckCircle size={18} /> KOT Ticket Created
              </span>
              <button className="wf-btn wf-btn-secondary" style={{ padding: '2px 8px' }} onClick={() => setOrderReceipt(null)}>Close</button>
            </div>
            <div className="wf-receipt-box">
              <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px dashed #475569', paddingBottom: '4px' }}>
                KITCHEN ORDER TICKET (KOT)
              </div>
              <div>Order No: <strong>{orderReceipt.order_number}</strong></div>
              <div>Order Type: <strong>{orderReceipt.order_type}</strong></div>
              <div>Status: <span className="wf-badge wf-badge-warning">{orderReceipt.status}</span></div>
              <div>Payment: <strong>{orderReceipt.paymentMode}</strong></div>
              <div style={{ margin: '8px 0', borderTop: '1px dashed #475569' }}></div>
              {orderReceipt.cartItems?.map((ci, idx) => (
                <div key={idx} className="flex-between">
                  <span>{ci.quantity}× {ci.name}</span>
                  <span>₹{(ci.price * ci.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ margin: '8px 0', borderTop: '1px dashed #475569' }}></div>
              <div className="flex-between" style={{ fontWeight: 'bold' }}>
                <span>Subtotal:</span>
                <span>₹{orderReceipt.subtotal?.toFixed(2)}</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                Sent to Kitchen Queue automatically.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
