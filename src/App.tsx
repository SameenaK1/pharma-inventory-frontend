import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Routes, Route } from 'react-router-dom'; // 👈 1. Import router components
import Header from './components/header';
import Sidebar from './components/sidebar'; // Make sure this uses 'useNavigate' from Option 1
import Dashboard from './components/dashboard';
import AddInventory from './components/addmedicine';
import NotFoundPage from './components/notfound';

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
              
              {/* 404 Route: displays the not found page */}
              <Route path="/404-not-found" element={<NotFoundPage />} />
              
              {/* Catch-all Route: redirects to 404 page for any other path */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </div>
        </div>
      </div>
    </MantineProvider>
  );
}