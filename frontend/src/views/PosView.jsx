import React, { useState, useEffect } from 'react';
import {
  fetchPosTables,
  fetchPosOrders,
  billOrder,
  fetchCustomerByPhone,
  transferOrderTable,
  appendItemsToOrder,
  voidOrderItem,
  payDigitalPayment
} from '../api/client';
import ThermalReceiptModal from '../components/ThermalReceiptModal';

export default function PosView() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0.0);
  const [taxPercentage, setTaxPercentage] = useState(5.0);
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Customer Loyalty State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLoyalty, setCustomerLoyalty] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0.0);

  // Billing & Print Modal State
  const [billingResult, setBillingResult] = useState(null);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);

  // Table Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTableId, setTargetTableId] = useState('');

  // Digital Payment Simulation State
  const [showDigitalPayModal, setShowDigitalPayModal] = useState(false);
  const [digitalPayResult, setDigitalPayResult] = useState(null);

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


  useEffect(() => {
    loadPosData();
  }, []);

  const loadPosData = async () => {
    try {
      const t = await fetchPosTables();
      const o = await fetchPosOrders();
      setTables(t);
      setOrders(o);
      if (selectedOrder) {
        const updated = o.find(item => item.id === selectedOrder.id && item.status !== 'BILLED');
        setSelectedOrder(updated || null);
      }
    } catch (err) {
      console.error("Error loading POS data:", err);
    }
  };


  const handleLookupCustomer = async () => {
    if (!customerPhone) return;
    try {
      const res = await fetchCustomerByPhone(customerPhone);
      setCustomerLoyalty(res);
    } catch (err) {
      alert("Customer lookup error: " + err.message);
    }
  };

  const handleVoidItem = async (orderItemId) => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to void this item from the open bill?")) return;
    try {
      await voidOrderItem(selectedOrder.id, orderItemId, "Item voided by cashier");
      loadPosData();
    } catch (err) {
      alert("Error voiding item: " + err.message);
    }
  };

  const handleTransferTable = async () => {
    if (!selectedOrder || !targetTableId) return;
    try {
      await transferOrderTable(selectedOrder.id, parseInt(targetTableId));
      setShowTransferModal(false);
      loadPosData();
    } catch (err) {
      alert("Error transferring table: " + err.message);
    }
  };

  const handleSimulateDigitalPay = async () => {
    if (!selectedOrder) return;
    try {
      const res = await payDigitalPayment(selectedOrder.id, "UPI_QR", selectedOrder.total_amount);
      setDigitalPayResult(res);
      setShowDigitalPayModal(true);
    } catch (err) {
      alert("Payment Gateway simulation error: " + err.message);
    }
  };

  // Settlement & Deduction Breakdown Summary Modal State
  const [showDeductionSummaryModal, setShowDeductionSummaryModal] = useState(false);

  const handleFinalBilling = async () => {
    if (!selectedOrder) return;
    try {
      const res = await billOrder(selectedOrder.id, {
        discount_amount: parseFloat(discountAmount) || 0.0,
        tax_percentage: parseFloat(taxPercentage) || 5.0,
        payment_mode: paymentMode,
        customer_phone: customerPhone || null,
        redeem_loyalty_points: parseFloat(redeemPoints) || 0.0
      });
      setBillingResult(res);
      setShowDeductionSummaryModal(true);
      setSelectedOrder(null);
      setDiscountAmount('');
      setTaxPercentage('5');
      setPaymentMode('CASH');
      setCustomerPhone('');
      setCustomerLoyalty(null);
      setRedeemPoints(0.0);
      loadPosData();

    } catch (err) {
      alert("Error generating bill: " + err.message);
    }
  };


  // Subtotal & Calculations
  const subtotal = selectedOrder ? selectedOrder.subtotal : 0.0;
  const netDiscount = parseFloat(discountAmount || 0) + parseFloat(redeemPoints || 0);
  const taxableSubtotal = Math.max(0, subtotal - netDiscount);
  const taxAmount = (taxableSubtotal * (parseFloat(taxPercentage) || 0)) / 100;
  const grandTotal = taxableSubtotal + taxAmount;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] w-full bg-background rounded-xl border border-outline-variant overflow-hidden shadow-lg">
      {/* Center Section: Floor Plan Table Map & Orders Queue */}
      <div className="flex-1 flex flex-col p-6 gap-6 h-full overflow-y-auto custom-scrollbar">
        {/* Table Layout Plan Grid */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">table_restaurant</span>
              Floor Plan & Table Layout
            </h2>
            <div className="flex gap-4 text-xs font-label-bold">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim border border-tertiary-fixed"></span> Available</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary-container border border-secondary"></span> Occupied</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary-fixed-dim border border-primary"></span> Reserved</div>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {tables.map(t => (
              <button
                key={t.id}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${
                  t.status === 'AVAILABLE'
                    ? 'border-tertiary-fixed-dim bg-surface hover:bg-surface-container-highest'
                    : t.status === 'OCCUPIED'
                    ? 'border-secondary-container bg-secondary-fixed text-on-secondary-container font-bold shadow-sm'
                    : 'border-primary-fixed-dim bg-surface-container'
                }`}
                onClick={() => {
                  const activeOrd = orders.find(o => o.table_id === t.id && o.status !== 'BILLED');
                  if (activeOrd) setSelectedOrder(activeOrd);
                }}
              >
                <span className="material-symbols-outlined text-2xl mb-1">table_restaurant</span>
                <span className="font-bold text-sm">Table {t.table_number}</span>
                <span className="text-[11px] opacity-80">Cap: {t.capacity}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Active Orders Queue */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline-md text-xl font-bold text-on-surface">Active Orders Queue</h2>
            <span className="bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-full">
              {orders.filter(o => o.status !== 'BILLED').length} Active Tabs
            </span>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Order #</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Table</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Type</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant">Status</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant text-right">Subtotal</th>
                  <th className="p-3 text-xs font-bold text-on-surface-variant border-b border-outline-variant text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.status !== 'BILLED').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-on-surface-variant">No open orders. Place an order from the Kiosk view.</td>
                  </tr>
                ) : (
                  orders.filter(o => o.status !== 'BILLED').map(o => (
                    <tr
                      key={o.id}
                      className={`border-b border-outline-variant transition-colors hover:bg-surface-container-low ${
                        selectedOrder?.id === o.id ? 'bg-primary-fixed/40 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 font-mono text-sm font-bold text-primary">{o.order_number}</td>
                      <td className="p-3 font-bold text-sm">{o.table_number ? `T-${o.table_number}` : 'Takeaway'}</td>
                      <td className="p-3 text-xs">{o.order_type}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          o.status === 'PREPARING'
                            ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                            : o.status === 'SERVED'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                            : 'bg-error-container text-on-error-container'
                        }`}>
                          <span className="material-symbols-outlined text-xs">local_fire_department</span>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm">₹{o.total_amount.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <button
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            selectedOrder?.id === o.id
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'bg-surface border border-outline text-on-surface hover:bg-surface-container-highest'
                          }`}
                          onClick={() => setSelectedOrder(o)}
                        >
                          {selectedOrder?.id === o.id ? 'Active' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Right Panel: Billing Checkout Terminal */}
      <aside
        className="relative bg-surface-container-lowest border-l border-outline-variant h-full flex flex-col shadow-xl shrink-0 group"
        style={{ width: `${cartWidth}px` }}
      >
        {/* Left Drag Handle for Cart Pane */}
        <div
          className="absolute top-0 left-0 bottom-0 w-2 cursor-col-resize hover:bg-secondary/40 active:bg-secondary transition-colors z-50 flex items-center justify-center -ml-1"
          onMouseDown={handleCartResizeStart}
          title="Drag to resize checkout panel width"
        >
          <div className="w-0.5 h-8 bg-outline-variant/60 rounded-full group-hover:bg-secondary"></div>
        </div>

        {/* Checkout Header */}
        <div className="p-4 border-b border-outline-variant bg-surface flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-on-surface">
                {selectedOrder ? (selectedOrder.table_number ? `Table ${selectedOrder.table_number}` : 'Takeaway Counter') : 'Select an Order'}
              </h3>
              <p className="font-mono text-xs text-on-surface-variant">
                {selectedOrder ? `Order #${selectedOrder.order_number}` : 'No active order selected'}
              </p>
            </div>
            {selectedOrder && (
              <button
                className="w-10 h-10 rounded-full bg-surface-container-highest hover:bg-secondary-fixed flex items-center justify-center text-on-surface transition-colors"
                title="Transfer Table"
                onClick={() => setShowTransferModal(true)}
              >
                <span className="material-symbols-outlined">swap_horiz</span>
              </button>
            )}
          </div>
        </div>

        {/* Itemized Bill List */}
        {!selectedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-on-surface-variant text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">receipt_long</span>
            <p className="font-bold text-sm">No Order Selected</p>
            <p className="text-xs text-on-surface-variant mt-1">Select an active order from the left queue to open the billing terminal.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2.5 rounded-lg border border-outline-variant bg-surface-container-low">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">{item.menu_item_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-surface-container-highest text-on-surface-variant">
                        x{item.quantity}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-on-surface-variant">₹{item.unit_price.toFixed(2)} ea</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                    <button
                      className="text-outline hover:text-error transition-colors"
                      title="Void Item"
                      onClick={() => handleVoidItem(item.id)}
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Loyalty Section */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
              <div className="flex gap-2">
                <input
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-sm font-mono outline-none focus:border-secondary"
                  placeholder="Customer Phone No."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <button
                  className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-xs whitespace-nowrap hover:bg-secondary-fixed"
                  onClick={handleLookupCustomer}
                >
                  Lookup
                </button>
              </div>

              {customerLoyalty && (
                <div className="mt-2 p-2.5 bg-tertiary-container/10 border border-tertiary-container rounded-lg text-xs space-y-1">
                  <div className="font-bold text-on-tertiary-container">{customerLoyalty.name}</div>
                  <div className="flex justify-between font-mono">
                    <span>Available Loyalty Points:</span>
                    <span className="font-bold">{customerLoyalty.loyalty_points.toFixed(1)} pts</span>
                  </div>
                  {customerLoyalty.loyalty_points > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border border-outline-variant rounded text-xs font-mono"
                        placeholder="Redeem pts"
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(e.target.value)}
                      />
                      <span className="text-[11px] text-on-surface-variant">Max discount</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Discounts, Tax & Payment Totals */}
            <div className="p-4 bg-surface-container border-t border-outline-variant flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-on-surface-variant font-bold block mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-xs font-mono"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-on-surface-variant font-bold block mb-1">GST Tax (%)</label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-xs font-mono"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-outline-variant pt-2 text-xs">
                <div className="flex justify-between text-on-surface-variant font-mono">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-mono">
                  <span>Discounts & Points</span>
                  <span>-₹{netDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-mono">
                  <span>GST Tax ({taxPercentage}%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-on-surface mt-1 pt-1 border-t border-outline-variant font-mono">
                  <span>Grand Total</span>
                  <span className="text-primary text-lg">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Card', 'Cash'].map((mode) => (
                    <button
                      key={mode}
                      className={`py-2 flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        paymentMode === mode
                          ? 'border-2 border-secondary bg-surface-container-lowest text-secondary shadow-sm'
                          : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                      }`}
                      onClick={() => setPaymentMode(mode)}
                    >
                      <span className="material-symbols-outlined text-lg mb-0.5">
                        {mode === 'UPI' ? 'qr_code_scanner' : mode === 'Card' ? 'credit_card' : 'payments'}
                      </span>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMode === 'UPI' && (
                <button
                  className="w-full py-2 bg-surface-container-highest text-primary rounded-lg text-xs font-bold hover:bg-secondary-fixed flex items-center justify-center gap-1"
                  onClick={handleSimulateDigitalPay}
                >
                  <span className="material-symbols-outlined text-sm">qr_code</span>
                  Simulate Gateway UPI QR Code
                </button>
              )}

              {/* Final Billing Button */}
              <button
                className="w-full py-3.5 bg-secondary text-on-secondary rounded-xl font-bold text-base hover:bg-secondary-container hover:text-on-secondary-container shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mt-1"
                onClick={handleFinalBilling}
              >
                <span className="material-symbols-outlined">receipt_long</span>
                Pay & Deduct Stock
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Modal 1: Table Transfer Popup */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 max-w-sm w-full shadow-2xl">
            <h4 className="font-bold text-lg mb-2">Transfer Table Bill</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Select destination table to move Order #{selectedOrder?.order_number}:
            </p>
            <select
              className="w-full p-2.5 border border-outline-variant rounded-lg text-sm font-mono mb-4 bg-surface"
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
            >
              <option value="">Select Target Table</option>
              {tables.filter(t => t.id !== selectedOrder?.table_id).map(t => (
                <option key={t.id} value={t.id}>
                  Table {t.table_number} ({t.status})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg text-xs font-bold"
                onClick={() => setShowTransferModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold"
                onClick={handleTransferTable}
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Digital Payment Gateway Simulator Popup */}
      {showDigitalPayModal && digitalPayResult && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 max-w-sm w-full text-center shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-secondary mb-2">qr_code_2</span>
            <h4 className="font-bold text-lg mb-1">UPI Payment Gateway Simulator</h4>
            <p className="text-xs text-on-surface-variant mb-3">Scan QR code using PhonePe / GooglePay / Paytm</p>
            <div className="bg-surface p-4 rounded-lg border border-outline-variant font-mono text-xs break-all mb-4">
              {digitalPayResult.qr_payload}
            </div>
            <div className="bg-tertiary-fixed text-on-tertiary-fixed-variant p-2 rounded text-xs font-bold mb-4">
              Status: {digitalPayResult.status} (Txn: {digitalPayResult.transaction_id})
            </div>
            <button
              className="w-full py-2 bg-primary text-on-primary rounded-lg text-xs font-bold"
              onClick={() => setShowDigitalPayModal(false)}
            >
              Close & Proceed to Billing
            </button>
          </div>
        </div>
      )}

      {/* Modal 3: Order Billed & Raw Material Deduction Breakdown Summary Popup */}
      {showDeductionSummaryModal && billingResult && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl border-2 border-outline-variant p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                <h3 className="font-bold text-lg text-primary">Order Settled & Stock Deducted</h3>
              </div>
              <span className="bg-secondary-container text-on-secondary-container font-mono text-xs font-bold px-2.5 py-1 rounded-full border border-secondary-fixed">
                {billingResult.order?.order_number}
              </span>
            </div>

            {/* Settlement Summary Info */}
            <div className="grid grid-cols-2 gap-2 bg-surface-container p-3 rounded-xl border border-outline-variant text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">Payment Mode:</span>
                <strong className="block text-primary uppercase font-bold">{billingResult.order?.payment_mode}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Total Paid:</span>
                <strong className="block text-secondary font-bold text-sm">₹{billingResult.order?.total_amount?.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Discounts / Points:</span>
                <strong className="block text-on-surface">₹{billingResult.order?.discount_amount?.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">GST Tax (5%):</span>
                <strong className="block text-on-surface">₹{billingResult.order?.tax_amount?.toFixed(2)}</strong>
              </div>
            </div>

            {/* Inventory Stock Deductions Ledger */}
            <div>
              <h4 className="font-bold text-xs text-primary mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">inventory_2</span>
                Automated Raw Material Stock Deductions:
              </h4>
              <div className="max-h-40 overflow-y-auto custom-scrollbar border border-outline-variant rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container sticky top-0">
                    <tr>
                      <th className="p-2 font-bold text-on-surface-variant border-b border-outline-variant">Ingredient</th>
                      <th className="p-2 font-bold text-on-surface-variant border-b border-outline-variant text-right">Deducted</th>
                      <th className="p-2 font-bold text-on-surface-variant border-b border-outline-variant text-right">New Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingResult.inventory_deduction?.deductions && billingResult.inventory_deduction.deductions.length > 0 ? (
                      billingResult.inventory_deduction.deductions.map((d, idx) => (
                        <tr key={idx} className="border-b border-outline-variant/40 hover:bg-surface-container-high">
                          <td className="p-2 font-bold text-on-surface">{d.ingredient}</td>
                          <td className="p-2 text-right font-mono font-bold text-error">-{d.used} {d.unit}</td>
                          <td className="p-2 text-right font-mono text-on-surface-variant">{d.new_stock} {d.unit}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-3 text-center text-on-surface-variant text-[11px]">
                          No recipe ingredient deductions required for this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-1.5"
                onClick={() => {
                  setShowDeductionSummaryModal(false);
                  setShowThermalReceipt(true);
                }}
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Print Thermal Ticket
              </button>
              <button
                className="flex-1 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold hover:bg-surface-variant transition-colors"
                onClick={() => setShowDeductionSummaryModal(false)}
              >
                Close & Next Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        isOpen={showThermalReceipt}
        onClose={() => setShowThermalReceipt(false)}
        billingData={billingResult}
      />
    </div>
  );
}

