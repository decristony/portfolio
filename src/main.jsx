import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ambience.css'
import App from './App'
import { applyTier, detectTier } from './lib/perfTier'

// nível de efeito do aparelho antes do primeiro desenho (ver src/lib/perfTier.js)
applyTier(detectTier())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
