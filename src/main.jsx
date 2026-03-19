import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PWAProvider } from './context/PWAContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PWAProvider>
      <App />
    </PWAProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then((registration) => {
      console.log('SW registered: ', registration);
    })
    .catch((error) => {
      console.log('SW registration failed: ', error);
    });
}
