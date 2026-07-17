// main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 👈 1. IMPORT THIS FIRST

// Import your global styles
import '@mantine/core/styles.css' 
import './index.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 2. WRAP YOUR APP COMPONENT IN BROWSERROUTER HERE 👇 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)