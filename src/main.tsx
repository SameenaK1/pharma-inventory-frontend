// main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

// Styles must be imported before components render
import '@mantine/core/styles.css' 
import '@mantine/notifications/styles.css'
import './index.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* 1. Add the MantineProvider wrapper here */}
      <MantineProvider>
        {/* 2. Place the Notifications component inside it */}
        <Notifications position="top-right" zIndex={1000} />
        <App />
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>,
)