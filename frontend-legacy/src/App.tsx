import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Car, Users, Wrench, MapPin, LogOut } from 'lucide-react';
import keycloak from './auth';
import './App.css';

import Dashboard    from './pages/Dashboard';
import Vehicules    from './pages/Vehicules';
import Conducteurs  from './pages/Conducteurs';
import Localisation from './pages/Localisation';
import Maintenance  from './pages/Maintenance';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

function getRoleLabel(): string {
  if (keycloak.hasRealmRole('admin'))      return 'Administrateur';
  if (keycloak.hasRealmRole('manager'))    return 'Manager';
  if (keycloak.hasRealmRole('technicien')) return 'Technicien';
  return 'Utilisateur';
}

function App() {
  const [authenticated, setAuthenticated] = useState(keycloak.authenticated ?? false);

  // Affiche la page de connexion personnalisée si l'utilisateur n'est pas authentifié
  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  const logout = () => keycloak.logout();
  const username = keycloak.tokenParsed?.preferred_username ?? '';

  return (
    <Router>
      <div className="app-container">
        {/* ───── Sidebar ───── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-box">
              <Car size={24} color="#fff" />
            </div>
            <span>FleetX</span>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/vehicules" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Car size={20} /> Véhicules
            </NavLink>
            <NavLink to="/conducteurs" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Users size={20} /> Conducteurs
            </NavLink>
            <NavLink to="/localisation" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <MapPin size={20} /> Localisation
            </NavLink>
            <NavLink to="/maintenance" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Wrench size={20} /> Maintenance
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <button onClick={logout} className="logout-btn">
              <LogOut size={20} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* ───── Main content ───── */}
        <main className="content">
          <header className="topbar">
            <div className="search-bar">
              <input type="text" placeholder="Rechercher…" />
            </div>
            <div className="user-profile">
              <div className="user-text">
                <span className="user-name">{username}</span>
                <span className="user-role">{getRoleLabel()}</span>
              </div>
              <div className="avatar" data-testid="user-avatar">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <section className="page-content">
            <Routes>
              {/* Public (authenticated) */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Admin + Manager: gestion véhicules et conducteurs */}
              <Route path="/vehicules" element={
                <ProtectedRoute roles={['admin', 'manager', 'utilisateur', 'technicien']}>
                  <Vehicules />
                </ProtectedRoute>
              } />
              <Route path="/conducteurs" element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Conducteurs />
                </ProtectedRoute>
              } />

              {/* Tous les rôles: localisation */}
              <Route path="/localisation" element={
                <ProtectedRoute roles={['admin', 'manager', 'technicien', 'utilisateur']}>
                  <Localisation />
                </ProtectedRoute>
              } />

              {/* Admin + Technicien: maintenance */}
              <Route path="/maintenance" element={
                <ProtectedRoute roles={['admin', 'manager', 'technicien']}>
                  <Maintenance />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </main>
      </div>
    </Router>
  );
}

export default App;
