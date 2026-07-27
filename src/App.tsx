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
  const location = useLocation(); // 2. Grab the current URL path

  // 3. Check if the user is currently on the login page
  const isLoginPage = location.pathname === '/login';
  return (
    <GoogleOAuthProvider clientId="76787419088-nv3nspbilnd3gu6dnai2vposgf25afdd.apps.googleusercontent.com">
    <MantineProvider defaultColorScheme="light">
      {isLoginPage ? (
        // Render ONLY the login page with no dashboard wrapping elements
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/addmedicine" element={<AddInventory />} />
              <Route path="/login" element={<LoginPage />} />
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