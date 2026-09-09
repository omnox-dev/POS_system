import React from 'react';
import { Printer, X } from 'lucide-react';

export default function ThermalReceiptModal({ isOpen = true, billingData, order, onClose }) {
  if (isOpen === false) return null;
  const targetOrder = billingData?.order || order || billingData;
  if (!targetOrder) return null;

  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="wf-modal-overlay">
      <div className="wf-modal-card" style={{ maxWidth: '400px', padding: '16px' }}>
        <div className="flex-between" style={{ marginBottom: '12px', borderBottom: '1px solid var(--wf-border)', paddingBottom: '8px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Thermal Printer Preview (80mm)</span>
          <button className="wf-btn wf-btn-secondary" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Thermal Ticket Content */}
        <div id="printable-receipt" style={{
          background: '#ffffff',
          color: '#000000',
          padding: '20px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.4',
          border: '1px solid #ddd'
        }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
            RESTAURANT OS
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '12px' }}>
            123 Gourmet Street, Foodville
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Order #:</span> <strong>{targetOrder.order_number}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Type:</span> <span>{targetOrder.order_type}</span>
          </div>
          {targetOrder.table_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Table:</span> <strong>Table #{targetOrder.table_id}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Date:</span> <span>{new Date(targetOrder.created_at || Date.now()).toLocaleString()}</span>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th>Qty</th>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Amt</th>
              </tr>
            </thead>
            <tbody>
              {targetOrder.items && targetOrder.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ width: '10%' }}>{item.quantity}x</td>
                  <td style={{ width: '65%' }}>{item.menu_item_name}</td>
                  <td style={{ width: '25%', textAlign: 'right' }}>₹{(item.unit_price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>₹{targetOrder.subtotal ? targetOrder.subtotal.toFixed(2) : '0.00'}</span>
          </div>
          {targetOrder.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c00' }}>
              <span>Discount / Loyalty:</span>
              <span>-₹{targetOrder.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax (GST 5%):</span>
            <span>₹{targetOrder.tax_amount ? targetOrder.tax_amount.toFixed(2) : '0.00'}</span>
          </div>

          <div style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
            <span>GRAND TOTAL:</span>
            <span>₹{targetOrder.total_amount ? targetOrder.total_amount.toFixed(2) : targetOrder.subtotal ? targetOrder.subtotal.toFixed(2) : '0.00'}</span>
          </div>

          {targetOrder.payment_mode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px' }}>
              <span>Paid via:</span>
              <span>{targetOrder.payment_mode}</span>
            </div>
          )}


          <div style={{ borderTop: '1px dashed #000', margin: '12px 0 8px 0' }} />
          <div style={{ textAlign: 'center', fontSize: '10px', fontStyle: 'italic' }}>
            Thank you for dining with us!
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button className="wf-btn wf-btn-secondary" onClick={onClose}>Close</button>
          <button className="wf-btn wf-btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Thermal Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
