 import { useState } from 'react';

import { 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Activity, 
  ArrowUpRight
} from 'lucide-react';
 

const initialInventory = [
  { id: 'M001', name: 'Amoxicillin 500mg', batch: 'B-AMX92', stock: 14, price: 450, expiry: '2026-09-15', status: 'Low Stock' },
  { id: 'M002', name: 'Paracetamol 650mg', batch: 'B-PCM04', stock: 450, price: 20, expiry: '2028-04-20', status: 'Good' },
  { id: 'M003', name: 'Metformin 1000mg', batch: 'B-MET44', stock: 85, price: 180, expiry: '2027-11-05', status: 'Good' },
  { id: 'M004', name: 'Ibuprofen 400mg', batch: 'B-IBU11', stock: 0, price: 90, expiry: '2026-08-30', status: 'Out of Stock' },
  { id: 'M005', name: 'Atorvastatin 20mg', batch: 'B-ATO08', stock: 120, price: 340, expiry: '2026-09-01', status: 'Good' },
  { id: 'M006', name: 'Cetirizine 10mg', batch: 'B-CET88', stock: 95, price: 45, expiry: '2026-08-10', status: 'Good' },
];

const salesData = [
  { id: 'TX101', item: 'Paracetamol 650mg', qty: 5, total: 100, time: '10 mins ago' },
  { id: 'TX102', item: 'Atorvastatin 20mg', qty: 2, total: 680, time: '45 mins ago' },
  { id: 'TX103', item: 'Metformin 1000mg', qty: 3, total: 540, time: '2 hours ago' },
];

export default function dashboard() {
  const [inventory] = useState(initialInventory);
  const [sales] = useState(salesData);

  // 2. LIVE DASHBOARD CALCULATIONS
  const totalSalesRevenue = sales.reduce((acc, current) => acc + current.total, 0);
  const totalItemsInStock = inventory.reduce((acc, item) => acc + item.stock, 0);
  
  const outOfStockItems = inventory.filter(item => item.stock === 0);
  const lowStockItems = inventory.filter(item => item.stock > 0 && item.stock <= 20);
  
  // Calculate medicines expiring within the next 60 days
  const expiringMedicines = inventory.filter(item => {
    const expiryDate = new Date(item.expiry);
    const currentDate = new Date();
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 60;
  });
  return (
  <div style={{ fontFamily: '"Inter", system-ui, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '32px', color: '#334155' }}>
        
      
        {/* 4-COLUMN TOP CALCULATION METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          
          {/* Total Sales Metric */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Sales Revenue</span>
              <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>₹{totalSalesRevenue.toLocaleString('en-IN')}</h3>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '12px', borderRadius: '12px' }}>
              <DollarSign size={24} />
            </div>
          </div>
  
          {/* Out of Stock Metric */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out of Stock SKUs</span>
              <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: outOfStockItems.length > 0 ? '#dc2626' : '#0f172a' }}>{outOfStockItems.length}</h3>
            </div>
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '12px' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
  
          {/* Expiring Soon Metric */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiring Soon (&lt;60d)</span>
              <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: expiringMedicines.length > 0 ? '#d97706' : '#0f172a' }}>{expiringMedicines.length}</h3>
            </div>
            <div style={{ backgroundColor: '#fff7ed', color: '#d97706', padding: '12px', borderRadius: '12px' }}>
              <Calendar size={24} />
            </div>
          </div>
  
          {/* Live Active Units Metric */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Stock Volume</span>
              <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{totalItemsInStock}</h3>
            </div>
            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: '12px' }}>
              <Activity size={24} />
            </div>
          </div>
  
        </div>
  
        {/* CENTRAL APP LAYOUT ROW SPLIT */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: CRITICAL DATA TABLES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Main Stock Inventory Status */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Global Stock Metrics</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '12px' }}>
                      <th style={{ paddingBottom: '12px' }}>Medicine Label</th>
                      <th style={{ paddingBottom: '12px' }}>Batch No.</th>
                      <th style={{ paddingBottom: '12px' }}>Available Vol.</th>
                      <th style={{ paddingBottom: '12px' }}>Exp. Window</th>
                      <th style={{ paddingBottom: '12px' }}>Status Guard</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: '#334155' }}>
                    {inventory.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 0', fontWeight: '600', color: '#0f172a' }}>{item.name}</td>
                        <td style={{ padding: '16px 0', fontFamily: 'monospace', color: '#64748b' }}>{item.batch}</td>
                        <td style={{ padding: '16px 0', fontWeight: '500' }}>{item.stock} boxes</td>
                        <td style={{ padding: '16px 0', color: '#64748b' }}>{item.expiry}</td>
                        <td style={{ padding: '16px 0' }}>
                          <span style={{
                            backgroundColor: item.status === 'Good' ? '#f0fdf4' : item.status === 'Low Stock' ? '#fff7ed' : '#fef2f2',
                            color: item.status === 'Good' ? '#16a34a' : item.status === 'Low Stock' ? '#ea580c' : '#dc2626',
                            padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700'
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
  
            {/* Special Focus: Critical Warnings Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Out of Stock Warning Container */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Immediate Out-of-Stock Risk
                </h4>
                {outOfStockItems.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>All lines clean. Zero stock depletion.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: '1.8' }}>
                    {outOfStockItems.concat(lowStockItems).map((item) => (
                      <li key={item.id}>
                        <strong>{item.name}</strong> ({item.stock} left)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
  
              {/* Impending Expiry Warnings Container */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#d97706', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} /> Impending Expiry (&lt; 60 Days)
                </h4>
                {expiringMedicines.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Zero batches approaching immediate discard window.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: '1.8' }}>
                    {expiringMedicines.map((item) => (
                      <li key={item.id}>
                        {item.name} <span style={{ color: '#ef4444', fontWeight: '600' }}>(Exp: {item.expiry})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
  
            </div>
  
          </div>
  
          {/* RIGHT COLUMN: AI CONSOLE & LIVE BILLING FLOW */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
    {/* Block Header (Matches Live Store Logs Header) */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Shelf Life Watchlist</h3>
      <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
        View Schedule <ArrowUpRight size={14} />
      </span>
    </div>
  
    {/* Rows Container */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Log Entry 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Cetirizine 10mg</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Batch: B-CET88 • 95 boxes at risk</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}>Aug 10</span>
      </div>
  
      {/* Log Entry 2 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Ibuprofen 400mg</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Batch: B-IBU11 • 0 boxes at risk</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#ea580c', backgroundColor: '#fff7ed', padding: '4px 8px', borderRadius: '6px' }}>Aug 30</span>
      </div>
  
      {/* Log Entry 3 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Atorvastatin 20mg</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Batch: B-ATO08 • 120 boxes at risk</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#ea580c', backgroundColor: '#fff7ed', padding: '4px 8px', borderRadius: '6px' }}>Sep 01</span>
      </div>
  
     
  
    </div>
  </div>
            
            {/* Recent Counter Sales Component */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Live Store Logs</h3>
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                  View Logs <ArrowUpRight size={14} />
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sales.map((sale) => (
                  <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{sale.item}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Qty: {sale.qty} units • {sale.time}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>₹{sale.total}</span>
                  </div>
                ))}
              </div>
            </div>
  
          </div>
  
        </div>
  
      </div>
  )}