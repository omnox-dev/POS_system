import React, { useState, useEffect } from 'react';
import { fetchKioskMenu, fetchKioskTables, placeKioskOrder } from '../api/client';

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

  // Resizable Right Cart Panel State
  const [cartWidth, setCartWidth] = useState(380);
  const [isResizingCart, setIsResizingCart] = useState(false);

  const handleCartResizeStart = (e) => {
    e.preventDefault();
    setIsResizingCart(true);

    const handleMouseMove = (moveEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = Math.min(Math.max(windowWidth - moveEvent.clientX, 280), 560);
      setCartWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingCart(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Fallback high quality food imagery for dishes

  const foodImages = [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", // Burger
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80", // Salad
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80", // Pizza
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", // Drinks
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80"  // Samosa/Starters
  ];

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
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, notes: '' }];
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
  const taxAmount = cartSubtotal * 0.085;
  const grandTotal = cartSubtotal + taxAmount;

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
        notes: ci.notes || "Placed via Kiosk"
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
    <div className="h-[calc(100vh-1.5rem)] w-full flex overflow-hidden font-body-md select-none rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg">

      {/* Main Content Area (Left) */}
      <main className="flex-1 flex flex-col h-full bg-surface-container-lowest overflow-hidden">
        {/* Header: Order Type & Categories */}
        <header className="flex flex-col border-b border-outline-variant bg-surface-container-lowest shrink-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                restaurant_menu
              </span>
              <div>
                <h1 className="font-headline-lg text-2xl font-bold text-primary">Rajgad Royal</h1>
                <span className="text-xs text-on-surface-variant font-medium">Self-Ordering Touch Kiosk</span>
              </div>
            </div>

            {/* Order Type Selector */}
            <div className="flex items-center bg-surface-container-high rounded-lg p-1 gap-1">
              <button
                className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-label-bold transition-all ${
                  orderType === 'DINE_IN'
                    ? 'bg-surface-container-lowest shadow-sm text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setOrderType('DINE_IN')}
              >
                <span className="material-symbols-outlined text-lg">deck</span>
                Dine-In
              </button>

              <button
                className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-label-bold transition-all ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-surface-container-lowest shadow-sm text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setOrderType('TAKEAWAY')}
              >
                <span className="material-symbols-outlined text-lg">takeout_dining</span>
                Takeaway
              </button>

              {orderType === 'DINE_IN' && (
                <>
                  <div className="w-px h-6 bg-outline-variant mx-1"></div>
                  <select
                    className="bg-surface-container-lowest text-primary font-label-bold text-xs outline-none cursor-pointer py-1.5 px-3 rounded-md border border-outline-variant/60 shadow-sm"
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                  >
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.status})
                      </option>
                    ))}
                  </select>

                </>
              )}
            </div>
          </div>

          {/* Category Filter Bar */}
          <div className="px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar border-t border-outline-variant/40">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-6 py-2 rounded-full text-sm font-label-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-variant'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Dish Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-container-low">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {filteredItems.map((item, idx) => (
              <article
                key={item.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md active:scale-[0.99]"
              >
                <div className="relative h-44 w-full bg-surface-variant overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    src={foodImages[idx % foodImages.length]}
                    alt={item.name}
                  />
                  <div className="absolute top-3 left-3 bg-tertiary-container text-on-tertiary-container font-label-bold text-xs px-2.5 py-1 rounded shadow-sm">
                    {item.is_available ? 'Available' : 'Sold Out'}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-lg font-bold text-on-surface">{item.name}</h3>
                    <span className="font-headline-md text-lg font-bold text-primary font-mono">₹{item.price.toFixed(2)}</span>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant line-clamp-2 mb-4 flex-1">
                    {item.description || "Prepared with fresh royal ingredients & traditional spice blend."}
                  </p>
                  <button
                    className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-bold text-sm rounded-lg h-11 flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm"
                    onClick={() => addToCart(item)}
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Add to Order
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* Right Sidebar: Cart & Order Drawer */}
      <aside
        className="relative bg-surface-container border-l border-outline-variant flex flex-col h-full shadow-lg shrink-0 group"
        style={{ width: `${cartWidth}px` }}
      >
        {/* Left Drag Handle for Cart Drawer */}
        <div
          className="absolute top-0 left-0 bottom-0 w-2 cursor-col-resize hover:bg-secondary/40 active:bg-secondary transition-colors z-50 flex items-center justify-center -ml-1"
          onMouseDown={handleCartResizeStart}
          title="Drag to resize cart drawer width"
        >
          <div className="w-0.5 h-8 bg-outline-variant/60 rounded-full group-hover:bg-secondary"></div>
        </div>

        {/* Cart Header */}
        <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center justify-between shrink-0">
          <h2 className="font-headline-lg text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">shopping_cart</span>
            Current Order ({cart.length})
          </h2>
          {cart.length > 0 && (
            <button
              className="text-error font-label-bold text-sm hover:bg-error-container hover:text-on-error-container px-3 py-1.5 rounded transition-colors"
              onClick={() => setCart([])}
            >
              Clear
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant text-center p-6 border-2 border-dashed border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">shopping_bag</span>
              <p className="font-label-bold text-sm">Your order is empty</p>
              <p className="text-xs text-on-surface-variant mt-1">Tap items on the left menu to add them to your bill.</p>
            </div>
          ) : (
            cart.map((ci) => (
              <div key={ci.menu_item_id} className="bg-surface-container-lowest p-3.5 rounded-lg border border-outline-variant flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-start">
                  <h4 className="font-label-bold text-sm font-bold text-on-surface">{ci.name}</h4>
                  <span className="font-label-bold text-sm font-mono text-primary font-bold">₹{(ci.price * ci.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-on-surface-variant font-mono">₹{ci.price.toFixed(2)} ea</span>
                  <div className="flex items-center gap-3 bg-surface-container rounded-lg p-1 border border-outline-variant">
                    <button
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-lowest rounded text-on-surface hover:bg-surface-variant shadow-sm active:scale-95"
                      onClick={() => updateQuantity(ci.menu_item_id, -1)}
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="font-headline-md font-bold text-on-surface w-5 text-center font-mono">{ci.quantity}</span>
                    <button
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-lowest rounded text-on-surface hover:bg-surface-variant shadow-sm active:scale-95"
                      onClick={() => updateQuantity(ci.menu_item_id, 1)}
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer / Checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-outline-variant bg-surface-container-lowest shrink-0">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">₹{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>GST Tax (8.5%)</span>
                <span className="font-mono font-semibold">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-on-surface mt-2 pt-2 border-t border-outline-variant border-dashed">
                <span>Total Amount</span>
                <span className="font-mono text-primary text-xl">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="w-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-headline-md text-base font-bold rounded-xl h-14 flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              onClick={handleCheckout}
              disabled={loading}
            >
              <span>{loading ? "Dispatching..." : "Place Order & Send KOT"}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </aside>

      {/* Confirmation Order Receipt Modal */}
      {orderReceipt && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-on-tertiary-container">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                <h3 className="font-bold text-lg">Order Created Successfully!</h3>
              </div>
              <button
                className="text-on-surface-variant hover:text-on-surface"
                onClick={() => setOrderReceipt(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant font-mono text-sm space-y-2">
              <div className="text-center font-bold text-base border-b border-dashed border-outline-variant pb-2">
                RAJGAD ROYAL KOT TICKET
              </div>
              <div className="flex justify-between">
                <span>Order No:</span>
                <span className="font-bold">{orderReceipt.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Type:</span>
                <span>{orderReceipt.order_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-0.5 rounded text-xs font-bold">
                  {orderReceipt.status}
                </span>
              </div>
              <div className="border-t border-dashed border-outline-variant my-2"></div>
              {orderReceipt.cartItems?.map((ci, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>{ci.quantity}× {ci.name}</span>
                  <span>₹{(ci.price * ci.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-outline-variant my-2"></div>
              <div className="flex justify-between font-bold text-sm">
                <span>Grand Total:</span>
                <span>₹{orderReceipt.total_amount?.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="w-full mt-4 bg-primary text-on-primary font-bold py-3 rounded-lg hover:bg-primary-container transition-colors"
              onClick={() => setOrderReceipt(null)}
            >
              Done & Start New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
