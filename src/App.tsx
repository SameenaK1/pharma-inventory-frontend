import { MantineProvider, Flex, Box } from '@mantine/core';
import { Routes, Route , useLocation} from 'react-router';
import { LoginPage } from './components/login';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import AddInventory from './components/addmedicine';
import Inventory from './components/inventory';
import NotFoundPage from './components/notfound';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  const location = useLocation();
  
  // 1. Change this to check for the root path instead of '/login'
  const isLoginPage = location.pathname === '/'; 

  return (
    <GoogleOAuthProvider clientId="76787419088-nv3nspbilnd3gu6dnai2vposgf25afdd.apps.googleusercontent.com">
      <MantineProvider defaultColorScheme="light">
        {isLoginPage ? (
          // 2. Render the login page directly at the root route
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        ) : (
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
                  {/* 3. Move your dashboard to a path like /dashboard or /app */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/addmedicine" element={<AddInventory />} />
                  <Route path="/404-not-found" element={<NotFoundPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Box>
            </Flex>
          </Flex>
        )}
      </MantineProvider>
    </GoogleOAuthProvider>
  );
}