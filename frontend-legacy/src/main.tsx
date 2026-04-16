import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { initKeycloak } from './auth'

const root = createRoot(document.getElementById('root')!)

initKeycloak(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
