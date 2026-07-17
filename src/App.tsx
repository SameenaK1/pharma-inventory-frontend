import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Routes, Route } from 'react-router-dom'; // 👈 1. Import router components
import Header from './components/header';
import Sidebar from './components/sidebar'; // Make sure this uses 'useNavigate' from Option 1
import Dashboard from './components/dashboard';
import AddInventory from './components/addmedicine';

export default function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <div style={{ fontFamily: '"Inter", system-ui, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '32px', color: '#334155' }}>
        <Header />
        
        <div style={{ display: 'flex', gap: '32px', marginTop: '32px', alignItems: 'flex-start' }}>
          <Sidebar /> 
          
          {/* Main Display Area */}
          <div style={{ flex: 1 }}>
            
            {/* 2. Wrap your paths inside Routes */}
            <Routes>
              {/* Home Route: loads Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Inventory Route: loads AddInventory */}
              <Route path="/addmedicine" element={<AddInventory />} />
              
              {/* Catch-all Route: displays a dummy layout for any other path */}
              <Route path="*" element={
                <div style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h2 style={{ marginTop: 0 }}>Page Under Construction</h2>
                  <p style={{ color: '#64748b', margin: 0 }}>This dummy workspace is coming soon!</p>
                </div>
              } />
            </Routes>

          </div>
        </div>
      </div>
    </MantineProvider>
  );
}