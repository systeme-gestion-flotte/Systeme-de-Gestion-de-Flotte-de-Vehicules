import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { initKeycloak } from './auth'

const root = createRoot(document.getElementById('root')!)

initKeycloak(
  () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  },
  (error) => {
    root.render(
      <div style={{ color: '#fff', backgroundColor: '#1e293b', padding: '2rem', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Erreur de connexion à Keycloak</h2>
        <pre style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
          {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
        </pre>
        <p>Veuillez vérifier :</p>
        <ul>
          <li>Que Keycloak tourne bien sur <code>http://localhost:9080</code></li>
          <li>Le Realm <code>fleet-management</code> et le Client <code>fleet-api-gateway</code> existent</li>
          <li>Les origines web (Web Origins) de Keycloak autorisent <code>http://localhost:5173</code> / <code>http://localhost:5174</code></li>
          <li>Avez-vous bien importé le fichier realm de Keycloak ?</li>
        </ul>
      </div>
    );
  }
)
