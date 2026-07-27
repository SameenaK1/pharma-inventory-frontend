import { MantineProvider, Flex, Box } from '@mantine/core';
import { Routes, Route } from 'react-router';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import AddInventory from './components/addmedicine';
import Inventory from './components/inventory';
import NotFoundPage from './components/notfound';

export default function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <Flex h="100vh" w="100vw" style={{ overflow: 'hidden' }}>
        <Sidebar />
        <Flex direction="column" style={{ flexGrow: 1, overflow: 'hidden' }}>
          <Header />
          <Box 
            component="main" 
            p="xl" 
            style={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              backgroundColor: '#f1f5f9' 
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/addmedicine" element={<AddInventory />} />
              <Route path="/404-not-found" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Box>

        </Flex>
      </Flex>
    </MantineProvider>
  );
}