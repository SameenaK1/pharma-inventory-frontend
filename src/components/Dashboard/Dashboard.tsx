import { useState } from 'react';
import { 
  Pill, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  Plus 
} from 'lucide-react';

// 1. DUMMY DATA SETS
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

export default function Dashboard() {
  const [inventory] = useState(initialInventory);
  const [sales] = useState(salesData);

  // 2. LIVE DASHBOARD CALCULATIONS
  const totalSalesRevenue = sales.reduce((acc, current) => acc + current.total, 0);
  const totalItemsInStock = inventory.reduce((acc, item) => acc + item.stock, 0);
  
  const outOfStockItems = inventory.filter(item => item.stock === 0);
  const lowStockItems = inventory.filter(item => item.stock > 0 && item.stock <= 20);
  
  // Calculate medicines expiring within the next 60 days (approx August/September 2026 based on July 2026)
  const expiringMedicines = inventory.filter(item => {
    const expiryDate = new Date(item.expiry);
    const currentDate = new Date('2026-07-14'); // System anchor point
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 60;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-800">
      
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-baseline gap-4">
            <div className="flex items-center gap-2">
              <Pill size={22} className="text-blue-600" />
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Pharma<span className="text-blue-600">Track</span>
              </span>
              <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded tracking-wider">
                CORE
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="text-slate-300">|</span>
              <span>Lucknow Central Hub</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block ml-1"></span>
              <span className="text-xs font-semibold text-emerald-500">Live</span>
            </div>
          </div>
        </div>
        <button className="bg-blue-600 text-white border-none px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors duration-200 shadow-lg hover:bg-blue-700">
          <Plus size={18} /> New Medicine Entry
        </button>
      </header>

      {/* 4-COLUMN TOP CALCULATION METRICS */}
      <div className="grid grid-cols-auto-fit-minmax gap-6 mb-8">
        
        {/* Total Sales Metric */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales Revenue</span>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">₹{totalSalesRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-green-50 text-emerald-500 p-3 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Out of Stock Metric */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock SKUs</span>
            <h3 className={`mt-2 text-2xl font-bold ${outOfStockItems.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {outOfStockItems.length}
            </h3>
          </div>
          <div className="bg-red-50 text-red-500 p-3 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Expiring Soon Metric */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Soon (&lt;60d)</span>
            <h3 className={`mt-2 text-2xl font-bold ${expiringMedicines.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {expiringMedicines.length}
            </h3>
          </div>
          <div className="bg-amber-50 text-amber-500 p-3 rounded-xl">
            <Calendar size={24} />
          </div>
        </div>

        {/* Live Active Units Metric */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Volume</span>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{totalItemsInStock}</h3>
          </div>
          <div className="bg-blue-50 text-blue-500 p-3 rounded-xl">
            <Activity size={24} />
          </div>
        </div>

      </div>

      {/* CENTRAL APP LAYOUT ROW SPLIT */}
      <div className="grid-cols-2.2fr-1fr gap-8 flex flex-col lg:flex-row">
        
        {/* LEFT COLUMN: CRITICAL DATA TABLES */}
        <div className="flex flex-col gap-8">
          
          {/* Main Stock Inventory Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">Global Stock Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-2 border-slate-100 text-slate-400 font-semibold uppercase text-xs">
                    <th className="pb-3">Medicine Label</th>
                    <th className="pb-3">Batch No.</th>
                    <th className="pb-3">Available Vol.</th>
                    <th className="pb-3">Exp. Window</th>
                    <th className="pb-3">Status Guard</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-4 font-mono text-slate-500">{item.batch}</td>
                      <td className="py-4 font-medium">{item.stock} boxes</td>
                      <td className="py-4 text-slate-500">{item.expiry}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          item.status === 'Good' ? 'bg-green-50 text-emerald-500' : 
                          item.status === 'Low Stock' ? 'bg-amber-50 text-amber-600' : 
                          'bg-red-50 text-red-500'
                        }`}>
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
          <div className="grid grid-cols-1fr-1fr gap-6">
            
            {/* Out of Stock Warning Container */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="mb-3 text-red-600 text-sm font-bold flex items-center gap-1.5">
                <AlertTriangle size={16} /> Immediate Out-of-Stock Risk
              </h4>
              {outOfStockItems.length === 0 ? (
                <p className="text-sm text-slate-500 m-0">All lines clean. Zero stock depletion.</p>
              ) : (
                <ul className="m-0 pl-4.5 text-sm text-slate-600 space-y-2">
                  {outOfStockItems.concat(lowStockItems).map((item) => (
                    <li key={item.id}>
                      <strong>{item.name}</strong> ({item.stock} left)
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Impending Expiry Warnings Container */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="mb-3 text-amber-600 text-sm font-bold flex items-center gap-1.5">
                <Calendar size={16} /> Impending Expiry (&lt; 60 Days)
              </h4>
              {expiringMedicines.length === 0 ? (
                <p className="text-sm text-slate-500 m-0">Zero batches approaching immediate discard window.</p>
              ) : (
                <ul className="m-0 pl-4.5 text-sm text-slate-600 space-y-2">
                  {expiringMedicines.map((item) => (
                    <li key={item.id}>
                      {item.name} <span className="text-red-500 font-semibold">(Exp: {item.expiry})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: AI CONSOLE & LIVE BILLING FLOW */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* Block Header (Matches Live Store Logs Header) */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base font-bold text-slate-900">Shelf Life Watchlist</h3>
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-0.5 cursor-pointer">
                View Schedule <ArrowUpRight size={14} />
              </span>
            </div>

            {/* Rows Container */}
            <div className="flex flex-col gap-4">
              
              {/* Log Entry 1 */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h4 className="m-0 text-sm font-semibold text-slate-800">Cetirizine 10mg</h4>
                  <span className="text-xs text-slate-500">Batch: B-CET88 • 95 boxes at risk</span>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Aug 10</span>
              </div>

              {/* Log Entry 2 */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h4 className="m-0 text-sm font-semibold text-slate-800">Ibuprofen 400mg</h4>
                  <span className="text-xs text-slate-500">Batch: B-IBU11 • 0 boxes at risk</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Aug 30</span>
              </div>

              {/* Log Entry 3 */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h4 className="m-0 text-sm font-semibold text-slate-800">Atorvastatin 20mg</h4>
                  <span className="text-xs text-slate-500">Batch: B-ATO08 • 120 boxes at risk</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Sep 01</span>
              </div>

            </div>
          </div>

          {/* Recent Counter Sales Component */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base font-bold text-slate-900">Live Store Logs</h3>
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-0.5 cursor-pointer">
                View Logs <ArrowUpRight size={14} />
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {sales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="m-0 text-sm font-semibold text-slate-800">{sale.item}</h4>
                    <span className="text-xs text-slate-500">Qty: {sale.qty} units • {sale.time}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">₹{sale.total}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}