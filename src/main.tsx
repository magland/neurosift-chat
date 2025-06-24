import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { UsageProvider } from './contexts/UsageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UsageProvider>
        <App />
      </UsageProvider>
    </BrowserRouter>
  </StrictMode>,
)
