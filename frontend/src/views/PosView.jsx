import React, { useState, useEffect } from 'react';
import {
  fetchPosTables,
  fetchPosOrders,
  processOrderBill,
  splitOrderBill,
  transferTable,
  appendItemsToOrder,
  voidOrderItem,
  simulateDigitalPayment,
  lookupCustomerLoyalty,
  fetchKioskMenu
} from '../api/client';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import { LayoutGrid, Receipt, Split, CheckSquare, Zap, ArrowRightLeft, PlusCircle, Trash2, QrCode, Award, Printer } from 'lucide-react';

export default function PosView() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(5.0);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [splitCount, setSplitCount] = useState(2);
  const [splitResult, setSplitResult] = useState(null);
  const [billingResponse, setBillingResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals & Customer Loyalty state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTableId, setTargetTableId] = useState('');
  const [showAppendModal, setShowAppendModal] = useState(false);
  const [selectedAppendMenuItem, setSelectedAppendMenuItem] = useState('');
  const [appendQty, setAppendQty] = useState(1);

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLoyalty, setCustomerLoyalty] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);

  const [digitalPayResult, setDigitalPayResult] = useState(null);
  const [showDigitalPayModal, setShowDigitalPayModal] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);

  useEffect(() => {
    loadData();
    loadMenuItems();
  }, []);

  const loadData = async () => {
    try {
      const t = await fetchPosTables();
      const o = await fetchPosOrders();
      setTables(t);
      setOrders(o);
      if (o.length > 0 && !selectedOrder) {
        setSelectedOrder(o[0]);
      }
    } catch (err) {
      console.error("Error loading POS data:", err);
    }
  };

  const loadMenuItems = async () => {
    try {
      const menu = await fetchKioskMenu();
      setMenuItems(menu);
      if (menu.length > 0) setSelectedAppendMenuItem(menu[0].id);
    } catch (err) {
      console.error("Error loading menu items:", err);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setSplitResult(null);
    setBillingResponse(null);
    setCustomerPhone(order.customer_phone || '');
    setCustomerLoyalty(null);
    setRedeemPoints(0);
    if (order.customer_phone) {
      handleLookupLoyalty(order.customer_phone);
    }
  };

  const handleLookupLoyalty = async (phoneToLookup) => {
    const p = phoneToLookup || customerPhone;
    if (!p) return;
    try {
      const cust = await lookupCustomerLoyalty(p);
      setCustomerLoyalty(cust);
    } catch (err) {
      setCustomerLoyalty(null);
    }
  };

  const handleTableTransfer = async () => {
    if (!selectedOrder || !targetTableId) return;
    try {
      const updated = await transferTable(selectedOrder.id, parseInt(targetTableId));
      alert(`Order ${selectedOrder.order_number} successfully transferred!`);
      setShowTransferModal(false);
      loadData();
    } catch (err) {
      alert("Transfer Error: " + err.message);
    }
  };

  const handleAppendItem = async () => {
    if (!selectedOrder || !selectedAppendMenuItem) return;
    try {
      const updated = await appendItemsToOrder(selectedOrder.id, [
        { menu_item_id: parseInt(selectedAppendMenuItem), quantity: parseInt(appendQty), notes: "Mid-meal addition" }
      ]);
      setSelectedOrder(updated);
      setShowAppendModal(false);
      setAppendQty(1);
      loadData();
    } catch (err) {
      alert("Error appending item: " + err.message);
    }
  };

  const handleVoidItem = async (orderItemId) => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to void this item from the bill?")) return;
    try {
      const res = await voidOrderItem(selectedOrder.id, orderItemId, "Customer Cancellation");
      setSelectedOrder(res.order);
      loadData();
    } catch (err) {
      alert("Error voiding item: " + err.message);
    }
  };

  const handleInitiateDigitalPay = async () => {
    if (!selectedOrder) return;
    const finalAmt = calculateFinalTotal();
    try {
      const res = await simulateDigitalPayment(selectedOrder.id, paymentMode, parseFloat(finalAmt));
      setDigitalPayResult(res);
      setShowDigitalPayModal(true);
    } catch (err) {
      alert("Digital Pay Error: " + err.message);
    }
  };

  const handleSplitBill = async () => {
    if (!selectedOrder) return;
    try {
      const res = await splitOrderBill(selectedOrder.id, splitCount);
      setSplitResult(res);
    } catch (err) {
      alert("Error splitting bill: " + err.message);
    }
  };

  const handleCompleteBilling = async () => {
    if (!selectedOrder) return;
    setLoading(true);

    const payload = {
      discount_amount: parseFloat(discount) || 0.0,
      tax_percentage: parseFloat(taxPercentage) || 5.0,
      payment_mode: paymentMode,
      redeem_loyalty_points: parseFloat(redeemPoints) || 0.0
    };

    try {
      const res = await processOrderBill(selectedOrder.id, payload);
      setBillingResponse(res);
      loadData();
    } catch (err) {
      alert("Error processing bill: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'BILLED' && o.status !== 'CANCELLED');

  const calculateFinalTotal = () => {
    if (!selectedOrder) return 0;
    const sub = selectedOrder.subtotal || 0;
    const disc = (parseFloat(discount) || 0) + (parseFloat(redeemPoints) || 0);
    const taxable = Math.max(0, sub - disc);
    const tax = taxable * ((parseFloat(taxPercentage) || 5) / 100);
    return (taxable + tax).toFixed(2);
  };

  return (
    <div className="view-grid-2">
      {/* Left Column: Tables Grid & Active KOT Orders */}
      <div>
        {/* Table Management Frame */}
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title"><LayoutGrid size={18} /> Restaurant Table Layout Plan</span>
            <span className="wf-badge wf-badge-info">{tables.length} Total Tables</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
            {tables.map(t => {
              const isOccupied = t.status === 'OCCUPIED';
              return (
                <div
                  key={t.id}
                  className="wf-card"
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    borderColor: isOccupied ? 'var(--wf-warning)' : 'var(--wf-border)',
                    backgroundColor: isOccupied ? 'rgba(245, 158, 11, 0.05)' : 'var(--wf-card-bg)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{t.table_number}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', margin: '4px 0' }}>Cap: {t.capacity} Seats</div>
                  <span className={`wf-badge ${isOccupied ? 'wf-badge-warning' : 'wf-badge-normal'}`}>
                    {t.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* KOT & Orders Queue Frame */}
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title"><Receipt size={18} /> Kitchen & Active Orders Queue</span>
            <span className="wf-badge wf-badge-warning">{activeOrders.length} Pending Bills</span>
          </div>

          <div className="wf-table-container">
            <table className="wf-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--wf-text-muted)' }}>
                      No active pending orders. Place an order from Kiosk view.
                    </td>
                  </tr>
                ) : (
                  activeOrders.map(ord => (
                    <tr
                      key={ord.id}
                      style={{
                        backgroundColor: selectedOrder?.id === ord.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{ord.order_number}</td>
                      <td><span className="wf-badge wf-badge-info">{ord.order_type}</span></td>
                      <td><span className="wf-badge wf-badge-warning">{ord.status}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>₹{ord.subtotal.toFixed(2)}</td>
                      <td>
                        <button
                          className={`wf-btn ${selectedOrder?.id === ord.id ? 'wf-btn-primary' : 'wf-btn-secondary'}`}
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleSelectOrder(ord)}
                        >
                          Select for Billing
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Billing Terminal & Extensions */}
      <div>
        <div className="wf-panel">
          <div className="wf-panel-header">
            <span className="wf-title"><CheckSquare size={18} /> Cashier Billing Terminal</span>
            {selectedOrder && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="wf-badge wf-badge-info">{selectedOrder.order_number}</span>
                <button className="wf-btn wf-btn-secondary" style={{ padding: '2px 6px' }} onClick={() => setSelectedOrderForPrint(selectedOrder)}>
                  <Printer size={14} /> Thermal Ticket
                </button>
              </div>
            )}
          </div>

          {!selectedOrder ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--wf-text-muted)' }}>
              Select an active order from the queue to process billing.
            </div>
          ) : selectedOrder.status === 'BILLED' ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--wf-success)', borderRadius: '6px' }}>
              <div style={{ color: 'var(--wf-success)', fontWeight: 'bold', fontSize: '1.1rem' }}>Order Already Billed</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginTop: '4px' }}>
                Stock deduction has already executed for {selectedOrder.order_number}.
              </p>
              <button className="wf-btn wf-btn-primary" style={{ marginTop: '12px' }} onClick={() => setSelectedOrderForPrint(selectedOrder)}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          ) : (
            <div>
              {/* Table Transfer & Add Items Toolbar */}
              <div className="flex-between" style={{ marginBottom: '12px', background: 'var(--wf-card-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--wf-border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {selectedOrder.table_id ? `Assigned: Table #${selectedOrder.table_id}` : 'Takeaway / Delivery'}
                </span>
                <div className="flex-gap-8">
                  {selectedOrder.table_id && (
                    <button className="wf-btn wf-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setShowTransferModal(true)}>
                      <ArrowRightLeft size={14} /> Transfer Table
                    </button>
                  )}
                  <button className="wf-btn wf-btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setShowAppendModal(true)}>
                    <PlusCircle size={14} /> Add Items to Bill
                  </button>
                </div>
              </div>

              {/* Items Breakdown with Void Action */}
              <div style={{ marginBottom: '16px', background: 'var(--wf-card-bg)', border: '1px solid var(--wf-border)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--wf-border)', paddingBottom: '4px' }}>
                  Ordered Items ({selectedOrder.items?.length || 0})
                </div>
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex-between" style={{ padding: '4px 0', fontSize: '0.85rem' }}>
                    <div>
                      <span>{it.quantity}× {it.menu_item_name}</span>
                      {it.notes && <span style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', marginLeft: '6px' }}>({it.notes})</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(it.unit_price * it.quantity).toFixed(2)}</span>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--wf-danger)', cursor: 'pointer' }}
                        title="Void item"
                        onClick={() => handleVoidItem(it.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Loyalty Section */}
              <div style={{ padding: '10px 12px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid var(--wf-border)', borderRadius: '6px', marginBottom: '16px' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--wf-accent)' }}>
                    <Award size={14} /> Customer Loyalty Program (5% Cashback)
                  </span>
                </div>
                <div className="flex-gap-8" style={{ marginBottom: '6px' }}>
                  <input
                    type="text"
                    className="wf-input"
                    placeholder="Customer Phone #"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  />
                  <button className="wf-btn wf-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleLookupLoyalty()}>
                    Lookup
                  </button>
                </div>
                {customerLoyalty && (
                  <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--wf-success)', fontFamily: 'var(--font-mono)' }}>
                    <span>{customerLoyalty.name} ({customerLoyalty.loyalty_points} Points)</span>
                    <input
                      type="number"
                      className="wf-input"
                      style={{ width: '80px', padding: '2px 4px', fontSize: '0.8rem' }}
                      placeholder="Redeem"
                      value={redeemPoints}
                      max={customerLoyalty.loyalty_points}
                      onChange={(e) => setRedeemPoints(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Discount & Tax Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div className="flex-between">
                  <label style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>Subtotal:</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex-gap-8">
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '2px' }}>Discount (₹):</label>
                    <input
                      type="number"
                      className="wf-input"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)', display: 'block', marginBottom: '2px' }}>GST Tax (%):</label>
                    <input
                      type="number"
                      className="wf-input"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      placeholder="5.0"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--wf-text-muted)' }}>Payment Mode:</label>
                    <button className="wf-btn wf-btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={handleInitiateDigitalPay}>
                      <QrCode size={12} /> Test Digital Payment QR
                    </button>
                  </div>
                  <select
                    className="wf-input"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="UPI">UPI / PhonePe / Paytm</option>
                    <option value="Card">Credit / Debit Card Swipe</option>
                    <option value="Cash">Cash</option>
                    <option value="Digital Payment">Simulated Gateway</option>
                  </select>
                </div>
              </div>

              {/* Split Bill Calculator Tool */}
              <div style={{ padding: '10px', background: 'var(--wf-card-bg)', border: '1px dashed var(--wf-border-dashed)', borderRadius: '6px', marginBottom: '16px' }}>
                <div className="flex-between" style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Split size={14} /> Split Bill Calculator
                  </span>
                  <div className="flex-gap-8">
                    <input
                      type="number"
                      className="wf-input"
                      style={{ width: '50px', padding: '2px 4px', textAlign: 'center', fontSize: '0.8rem' }}
                      value={splitCount}
                      min="2"
                      onChange={(e) => setSplitCount(parseInt(e.target.value) || 2)}
                    />
                    <button className="wf-btn wf-btn-secondary" style={{ padding: '2px 6px', fontSize: '0.75rem' }} onClick={handleSplitBill}>
                      Calculate
                    </button>
                  </div>
                </div>
                {splitResult && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--wf-accent)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                    Split between {splitResult.split_count} people: <strong>₹{splitResult.per_person_amount} / person</strong>
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="flex-between" style={{ padding: '12px 0', borderTop: '1px solid var(--wf-border)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Final Payable:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--wf-success)' }}>₹{calculateFinalTotal()}</span>
              </div>

              <button
                className="wf-btn wf-btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '8px' }}
                onClick={handleCompleteBilling}
                disabled={loading}
              >
                <Zap size={16} /> {loading ? "Processing & Deducting Stock..." : "Collect Payment & Deduct Inventory"}
              </button>
            </div>
          )}
        </div>

        {/* Live Inventory Auto-Deduction Log Output */}
        {billingResponse && (
          <div className="wf-panel" style={{ borderColor: 'var(--wf-accent)', marginTop: '20px' }}>
            <div className="wf-panel-header">
              <span className="wf-title" style={{ color: 'var(--wf-accent)' }}>
                ⚡ Auto Inventory Stock Deduction Triggered
              </span>
              <span className="wf-badge wf-badge-normal">DB Synced</span>
            </div>
            <div className="wf-receipt-box">
              <div style={{ color: 'var(--wf-success)', fontWeight: 'bold', marginBottom: '8px' }}>
                ✅ Order Billed & Stock Movement Log Created
              </div>
              <div style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                Stock deduction calculated for recipe ingredients:
              </div>
              {billingResponse.inventory_deduction?.deductions?.map((d, idx) => (
                <div key={idx} className="flex-between" style={{ fontSize: '0.8rem', padding: '2px 0' }}>
                  <span>Ingredient: <strong>{d.ingredient}</strong></span>
                  <span style={{ color: 'var(--wf-danger)' }}>-{d.used} {d.unit} (Stock now: {d.new_stock} {d.unit})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transfer Table Modal */}
      {showTransferModal && (
        <div className="wf-modal-overlay">
          <div className="wf-modal-card" style={{ maxWidth: '360px' }}>
            <h4>Transfer Order #{selectedOrder?.order_number}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginBottom: '12px' }}>
              Select target table to move active dine-in tab:
            </p>
            <select className="wf-input" value={targetTableId} onChange={(e) => setTargetTableId(e.target.value)} style={{ marginBottom: '16px' }}>
              <option value="">-- Select Target Table --</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.table_number} ({t.status})</option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="wf-btn wf-btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
              <button className="wf-btn wf-btn-primary" onClick={handleTableTransfer}>Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* Append Items Modal */}
      {showAppendModal && (
        <div className="wf-modal-overlay">
          <div className="wf-modal-card" style={{ maxWidth: '400px' }}>
            <h4>Append Mid-Meal Items to Order</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginBottom: '12px' }}>
              Select item and quantity to add to open bill:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <select className="wf-input" value={selectedAppendMenuItem} onChange={(e) => setSelectedAppendMenuItem(e.target.value)}>
                {menuItems.map(m => (
                  <option key={m.id} value={m.id}>{m.name} - ₹{m.price}</option>
                ))}
              </select>
              <input type="number" className="wf-input" min="1" value={appendQty} onChange={(e) => setAppendQty(e.target.value)} placeholder="Quantity" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="wf-btn wf-btn-secondary" onClick={() => setShowAppendModal(false)}>Cancel</button>
              <button className="wf-btn wf-btn-primary" onClick={handleAppendItem}>Add to Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Payment QR Modal */}
      {showDigitalPayModal && digitalPayResult && (
        <div className="wf-modal-overlay">
          <div className="wf-modal-card" style={{ maxWidth: '360px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--wf-accent)' }}>Digital Payment Simulator</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', margin: '4px 0 12px 0' }}>
              Scan QR code with UPI app to complete test payment:
            </p>
            <img src={digitalPayResult.qr_code_url} alt="UPI QR" style={{ width: '180px', height: '180px', margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Ref: {digitalPayResult.transaction_ref}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--wf-success)', marginTop: '4px' }}>{digitalPayResult.message}</div>
            <button className="wf-btn wf-btn-primary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={() => setShowDigitalPayModal(false)}>
              Close Simulator
            </button>
          </div>
        </div>
      )}

      {/* Thermal Ticket Printer Modal */}
      {selectedOrderForPrint && (
        <ThermalReceiptModal
          order={selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}
    </div>
  );
}

