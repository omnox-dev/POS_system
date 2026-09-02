import React, { useState, useEffect } from 'react';
import { fetchPosOrders, updateOrderStatus } from '../api/client';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import { UtensilsCrossed, Clock, CheckCircle2, Flame, RefreshCw, Printer, Bell } from 'lucide-react';

export default function KdsView() {
  const [orders, setOrders] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState(null);

  useEffect(() => {
    loadOrders();
    connectWebSocket();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchPosOrders();
      // Filter active non-billed tickets
      const kitchenOrders = data.filter(o => o.status !== 'BILLED' && o.status !== 'CANCELLED');
      setOrders(kitchenOrders);
    } catch (err) {
      console.error("Error loading KDS tickets:", err);
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/kds`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'NEW_KOT' || payload.event === 'STATUS_UPDATE' || payload.event === 'KOT_ITEMS_APPENDED') {
          loadOrders();
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      // Reconnect after 3s
      setTimeout(connectWebSocket, 3000);
    };
  };

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    let nextStatus = 'PREPARING';
    if (currentStatus === 'KOT_SENT') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'SERVED';

    try {
      await updateOrderStatus(orderId, nextStatus);
      loadOrders();
    } catch (err) {
      alert("Error updating order status: " + err.message);
    }
  };

  return (
    <div>
      {/* Top Header Bar */}
      <div className="wf-panel" style={{ padding: '12px 20px', marginBottom: '20px' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UtensilsCrossed size={22} color="var(--wf-accent)" />
            <span className="wf-title" style={{ fontSize: '1.2rem' }}>Kitchen Display System (KDS Live Screen)</span>
            <span className={`wf-badge ${wsConnected ? 'wf-badge-normal' : 'wf-badge-warning'}`}>
              <Bell size={12} /> {wsConnected ? 'WebSocket Live Connected' : 'Connecting WS...'}
            </span>
          </div>

          <button className="wf-btn wf-btn-secondary" onClick={loadOrders}>
            <RefreshCw size={16} /> Refresh Tickets
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      {orders.length === 0 ? (
        <div className="wf-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--wf-text-muted)' }}>
          <UtensilsCrossed size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3>All Kitchen Tickets Complete!</h3>
          <p style={{ fontSize: '0.9rem' }}>New orders placed from Kiosk or POS terminals will stream here in real-time.</p>
        </div>
      ) : (
        <div className="wf-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {orders.map(order => {
            const isSent = order.status === 'KOT_SENT';
            const isPreparing = order.status === 'PREPARING';
            const isServed = order.status === 'SERVED';

            return (
              <div key={order.id} className="wf-card" style={{
                borderTop: `4px solid ${isSent ? 'var(--wf-danger)' : isPreparing ? 'var(--wf-warning)' : 'var(--wf-success)'}`,
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}>
                <div>
                  <div className="flex-between" style={{ marginBottom: '8px', borderBottom: '1px solid var(--wf-border)', paddingBottom: '6px' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--wf-text-main)' }}>{order.order_number}</strong>
                      <span className="wf-badge wf-badge-info" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>{order.order_type}</span>
                    </div>
                    {order.table_id && (
                      <span className="wf-badge wf-badge-normal" style={{ fontSize: '0.85rem' }}>
                        Table #{order.table_id}
                      </span>
                    )}
                  </div>

                  <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`wf-badge ${isSent ? 'wf-badge-danger' : isPreparing ? 'wf-badge-warning' : 'wf-badge-normal'}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* KOT Items List */}
                  <div style={{ background: 'var(--wf-panel-bg)', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex-between" style={{ padding: '4px 0', borderBottom: idx < order.items.length - 1 ? '1px dashed var(--wf-border)' : 'none' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--wf-warning)', marginRight: '6px' }}>{item.quantity}x</span>
                          {item.menu_item_name}
                        </span>
                        {item.notes && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--wf-danger)', fontStyle: 'italic' }}>
                            ({item.notes})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="wf-btn wf-btn-secondary"
                    onClick={() => setSelectedTicketForPrint(order)}
                    title="Print Thermal Ticket"
                    style={{ padding: '8px' }}
                  >
                    <Printer size={16} />
                  </button>

                  {isSent && (
                    <button
                      className="wf-btn wf-btn-primary"
                      onClick={() => handleAdvanceStatus(order.id, order.status)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Flame size={16} /> Start Cooking (Preparing)
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      className="wf-btn"
                      onClick={() => handleAdvanceStatus(order.id, order.status)}
                      style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--wf-success)', color: 'var(--wf-success)' }}
                    >
                      <CheckCircle2 size={16} /> Mark Served
                    </button>
                  )}

                  {isServed && (
                    <button
                      className="wf-btn wf-btn-secondary"
                      disabled
                      style={{ flex: 1, justifyContent: 'center', opacity: 0.6 }}
                    >
                      Ready for Cashier Billing
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thermal Ticket Modal */}
      {selectedTicketForPrint && (
        <ThermalReceiptModal
          order={selectedTicketForPrint}
          onClose={() => setSelectedTicketForPrint(null)}
        />
      )}
    </div>
  );
}
