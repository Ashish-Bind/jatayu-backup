import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <Toaster />
        <App />
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
  // </StrictMode>
)
