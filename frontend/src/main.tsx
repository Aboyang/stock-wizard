import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { queryClient } from './app/queryClient'
import { startQuerySync } from './app/querySync'

startQuerySync(queryClient)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
