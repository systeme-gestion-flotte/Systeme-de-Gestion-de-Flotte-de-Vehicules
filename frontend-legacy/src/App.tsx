import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Car, Users as UsersIcon, MapPin, LogOut, 
  FileText, AlertTriangle, 
  Bell, User
} from 'lucide-react';
import keycloak from './auth';
import './App.css';
import './pages/Alertes.css';

import Dashboard    from './pages/Dashboard';
import Vehicules    from './pages/Vehicules';
import Conducteurs  from './pages/Conducteurs';
import Localisation from './pages/Localisation';
import Maintenance  from './pages/Maintenance';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';
import Login from './pages/Login';
import Alertes from './pages/Alertes';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Users from './pages/Users';

function getRoleLabel(): string {
  if (keycloak.hasRealmRole('manager'))    return 'Manager';
  if (keycloak.hasRealmRole('admin'))      return 'Admin';
  if (keycloak.hasRealmRole('technicien')) return 'Technicien';
  if (keycloak.hasRealmRole('utilisateur')) return 'Conducteur';
  return 'Conducteur';
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
}

const getNavItems = (): NavItem[] => {
  if (keycloak.hasRealmRole('admin')) {
    return [
      { label: 'Dashboard global', path: '/', icon: LayoutDashboard },
      { label: 'Gestion véhicules', path: '/vehicules', icon: Car },
      { label: 'Conducteurs', path: '/conducteurs', icon: UsersIcon },
      { label: 'Localisation globale', path: '/localisation', icon: MapPin },
      { label: 'Maintenance complète', path: '/maintenance', icon: FileText },
      { label: 'Alertes système', path: '/alerts', icon: AlertTriangle },
      { label: 'Utilisateurs', path: '/users', icon: UsersIcon },
    ];
  }

  if (keycloak.hasRealmRole('manager')) {
    return [
      { label: 'Dashboard Flotte', path: '/', icon: LayoutDashboard },
      { label: 'Gérer véhicules', path: '/vehicules', icon: Car },
      { label: 'Gérer conducteurs', path: '/conducteurs', icon: UsersIcon },
      { label: 'Localisation temps réel', path: '/localisation', icon: MapPin },
      { label: 'Suivi Maintenance', path: '/maintenance', icon: FileText },
      { label: 'Alertes Flotte', path: '/alerts', icon: AlertTriangle },
      { label: 'Utilisateurs', path: '/users', icon: UsersIcon },
    ];
  }

  if (keycloak.hasRealmRole('technicien')) {
    return [
      { label: 'Dashboard Maintenance', path: '/', icon: LayoutDashboard },
      { label: 'Parc véhicules', path: '/vehicules', icon: Car },
      { label: 'Ordres Maintenance', path: '/maintenance', icon: FileText },
      { label: 'Alertes Techniques', path: '/alerts', icon: AlertTriangle },
    ];
  }

  // Défaut : Conducteur
  return [
    { label: 'Mon Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Mon véhicule', path: '/vehicules', icon: Car },
    { label: 'Ma position GPS', path: '/localisation', icon: MapPin },
    { label: 'Signaler anomalie', path: '/maintenance', icon: FileText },
    { label: 'Mes Alertes', path: '/alerts', icon: AlertTriangle },
  ];
};

const commonItems: NavItem[] = [
  { label: 'Mon Profil', path: '/profile', icon: User },
  { label: 'Notifications', path: '/notifications', icon: Bell },
];

function App() {
  const [authenticated, setAuthenticated] = useState(keycloak.authenticated ?? false);

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  const logout = () => keycloak.logout();
  const username = keycloak.tokenParsed?.preferred_username ?? '';
  const navItems = getNavItems();

  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-box"><Car size={24} color="#fff" /></div>
            <span>FleetX</span>
          </div>

          <div className={`role-badge-sidebar ${getRoleLabel().toLowerCase()}`}>
            {getRoleLabel()}
          </div>

          <nav className="sidebar-nav scrollable">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
            
            <div className="nav-separator">Commun</div>
            
            {commonItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button onClick={logout} className="logout-btn">
              <LogOut size={20} /> Déconnexion
            </button>
          </div>
        </aside>

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
              <div className="avatar">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <section className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              <Route path="/vehicules" element={<Vehicules />} />
              <Route path="/conducteurs" element={<Conducteurs />} />
              <Route path="/localisation" element={<Localisation />} />
              <Route path="/maintenance" element={<Maintenance />} />
              
              <Route path="/users" element={<ProtectedRoute roles={['admin', 'manager']}><Users /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute roles={['admin', 'manager', 'technicien', 'utilisateur']}><Alertes /></ProtectedRoute>} />
              
              <Route path="/profile" element={<ProtectedRoute roles={['admin', 'manager', 'technicien', 'utilisateur']}><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute roles={['admin', 'manager', 'technicien', 'utilisateur']}><Notifications /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </main>
      </div>
    </Router>
  );
}

export default App;
