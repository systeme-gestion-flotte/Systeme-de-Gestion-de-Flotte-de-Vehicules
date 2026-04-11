# Fleet Management - Frontend

## Description
This is the React Microfrontend for the Fleet Management System. It provides a real-time dashboard and management interfaces for vehicles, drivers, location tracking, and maintenance. The application is built with React, Vite, and TypeScript. It features a modern, premium design utilizing glassmorphism and is secured via Keycloak.

## Technologies
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Premium design with glassmorphism)
- **Authentication**: Keycloak (`keycloak-js`)
- **Routing**: React Router
- **Real-time**: Socket.io-client
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Cypress (E2E)

## Prerequisites
- Node.js (v18+)
- Keycloak server running (configured with `fleet-management` realm)
- API Gateway running on port `4000`
- Localisation Service running on port `3002` (for WebSockets)

## Installation & Execution
```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## Architecture & Configuration
- `src/App.tsx`: Main layout, routing, and sidebar definition.
- `src/auth.ts`: Keycloak initialization and configuration.
- `src/api.ts`: Axios instance configured with an interceptor to automatically attach the Keycloak JWT token.
- `src/pages/Dashboard.tsx`: Real-time dashboard connected via `socket.io-client` to the `localisation-service`.

## Testing
End-to-end tests are implemented using Cypress.
```bash
# Ouvrir l'interface Cypress
npx cypress open

# Lancer les tests en mode headless
npx cypress run
```
