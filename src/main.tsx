import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AuthProvider from './context/AuthProvider'
import AccessibilityProvider from './context/AccessibilityProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider><AuthProvider><App /></AuthProvider></AccessibilityProvider>
  </StrictMode>,
)
