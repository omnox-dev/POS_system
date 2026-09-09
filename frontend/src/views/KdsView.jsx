import React, { useState, useEffect } from 'react';
import { updateOrderStatus } from '../api/client';

export default function KdsView() {
  const [kotOrders, setKotOrders] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Initial fetch of active orders for KDS
    fetchActiveKots();

    // Establish WebSocket connection to FastAPI KDS hub
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/kds`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to live KDS WebSocket Hub");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("KDS WS Event Received:", data);
        fetchActiveKots();
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      console.log("KDS WebSocket disconnected");
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchActiveKots = async () => {
    try {
      const res = await fetch('/api/pos/orders');
      const data = await res.json();
      // KDS displays orders needing cooking action (KOT_SENT, PENDING, PREPARING)
      const active = data.filter(o => o.status === 'KOT_SENT' || o.status === 'PENDING' || o.status === 'PREPARING');
      setKotOrders(active);
    } catch (err) {
      console.error("Error fetching KDS orders:", err);
    }
  };

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    let nextStatus = 'PREPARING';
    if (currentStatus === 'KOT_SENT' || currentStatus === 'PENDING') {
      nextStatus = 'PREPARING';
    } else if (currentStatus === 'PREPARING') {
      nextStatus = 'SERVED';
    }

    try {
      await updateOrderStatus(orderId, nextStatus);
      fetchActiveKots();
    } catch (err) {
      alert("Error updating order status: " + err.message);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full bg-background rounded-xl border border-outline-variant overflow-hidden shadow-lg">
      {/* Top Header & Live WS Connection Bar */}
      <header className="bg-surface-container-lowest flex justify-between items-center px-6 py-4 border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">restaurant</span>
            Rajgad Royal Kitchen Display (KDS)
          </span>

          <div className="flex items-center bg-surface-container-highest px-3 py-1 rounded-full gap-2 border border-outline-variant">
            <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-on-tertiary-container animate-pulse' : 'bg-error'}`}></div>
            <span className="text-xs font-bold text-on-surface">
              {wsConnected ? 'Live WS Connected' : 'Connecting WS...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-xs font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-base">filter_list</span>
            All Kitchen Stations
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-2" onClick={fetchActiveKots}>
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh Queue
          </button>
        </div>
      </header>

      {/* Main KOT Ticket Canvas */}
      <main className="flex-1 overflow-y-auto p-6 bg-surface-container-low">
        {kotOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant text-center p-8 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">done_all</span>
            <p className="font-bold text-base">All Kitchen Tickets Cleared!</p>
            <p className="text-xs text-on-surface-variant mt-1">No orders pending in stove or tandoor stations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kotOrders.map((order) => {
              const isNew = order.status === 'KOT_SENT' || order.status === 'PENDING';
              const isPreparing = order.status === 'PREPARING';
              const isServed = order.status === 'SERVED';

              return (
                <article
                  key={order.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-md flex flex-col relative overflow-hidden h-[420px]"
                >
                  {/* Left Color-coded Status Stripe */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isNew ? 'bg-error' : isPreparing ? 'bg-secondary-container' : 'bg-on-tertiary-container'
                    }`}
                  ></div>

                  {/* KOT Header */}
                  <div className="p-4 flex justify-between items-start border-b border-outline-variant pl-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isNew
                              ? 'bg-error-container text-on-error-container'
                              : isPreparing
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="font-mono text-xs font-bold text-on-surface-variant">#{order.order_number}</span>
                      </div>
                      <div className="font-bold text-lg text-on-surface">
                        {order.table_number ? `Table ${order.table_number}` : 'Takeaway Order'}
                      </div>
                    </div>

                    <div className="bg-surface-container-high px-2.5 py-1 rounded flex items-center gap-1 font-mono text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Dish Items List */}
                  <div className="flex-1 overflow-y-auto p-4 pl-4 space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex gap-3 items-start border-b border-outline-variant/30 pb-2">
                        <div className="font-mono font-bold text-lg text-primary">{item.quantity}×</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-on-surface">{item.menu_item_name}</div>
                          {item.notes && (
                            <div className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded text-[11px] font-bold mt-1 inline-block">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* KOT Action Footer */}
                  <div className="p-4 border-t border-outline-variant pl-4 bg-surface-container-lowest">
                    {isNew && (
                      <button
                        className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:bg-primary-container transition-colors active:scale-95 shadow-sm flex items-center justify-center gap-2"
                        onClick={() => handleAdvanceStatus(order.id, order.status)}
                      >
                        <span className="material-symbols-outlined text-base">skillet</span>
                        Start Cooking
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-lg font-bold text-sm hover:bg-secondary transition-colors active:scale-95 shadow-sm flex items-center justify-center gap-2"
                        onClick={() => handleAdvanceStatus(order.id, order.status)}
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Mark Served & Pass to Cashier
                      </button>
                    )}

                    {isServed && (
                      <div className="w-full bg-tertiary-fixed text-on-tertiary-fixed-variant py-3 rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-base">done_all</span>
                        Served to Table (Ready for Cashier)
                      </div>
                    )}

                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
