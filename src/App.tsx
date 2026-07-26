import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Routes, Route } from 'react-router-dom';
import { Container, Group } from '@mantine/core';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import AddInventory from './components/addmedicine';
import Inventory from './components/inventory';
import NotFoundPage from './components/notfound';

export default function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <Container fluid 
        px="xl" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', color: '#334155',width: '100%',
          maxWidth: '100%' }}>
        <Header />
        
        <Group gap="32px" mt="32px" align="flex-start">
          <Sidebar /> 
          
          {/* Main Display Area */}
          <div style={{ flex: 1 }}>
            
            {/* 2. Wrap your paths inside Routes */}
            <Routes>
              {/* Home Route: loads Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Inventory Route: loads the full inventory list/search page */}
              <Route path="/inventory" element={<Inventory />} />

              {/* Add Medicine Route: loads AddInventory form */}
              <Route path="/addmedicine" element={<AddInventory />} />
              
              {/* 404 Route: displays the not found page */}
              <Route path="/404-not-found" element={<NotFoundPage />} />
              
              {/* Catch-all Route: redirects to 404 page for any other path */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </div>
        </Group>
      </Container>
    </MantineProvider>
  );
}