import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, Car, Users, Wrench, MapPin, LogOut } from 'lucide-react';
import keycloak from './auth';
import './App.css';

import Dashboard from './pages/Dashboard';

const Vehicules = () => <div className="page-header"><h1>Gestion des Véhicules</h1></div>;
const Conducteurs = () => <div className="page-header"><h1>Gestion des Conducteurs</h1></div>;
const Maintenance = () => <div className="page-header"><h1>Maintenance</h1></div>;
const Localisation = () => <div className="page-header"><h1>Suivi Localisation</h1></div>;

function App() {
  const logout = () => keycloak.logout();

  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-box">
              <Car size={24} color="#fff" />
            </div>
            <span>FleetX</span>
          </div>
          <nav className="sidebar-nav">
            <Link to="/" className="nav-item"><LayoutDashboard size={20} /> Dashboard</Link>
            <Link to="/vehicules" className="nav-item"><Car size={20} /> Véhicules</Link>
            <Link to="/conducteurs" className="nav-item"><Users size={20} /> Conducteurs</Link>
            <Link to="/localisation" className="nav-item"><MapPin size={20} /> Localisation</Link>
            <Link to="/maintenance" className="nav-item"><Wrench size={20} /> Maintenance</Link>
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
              <input type="text" placeholder="Rechercher..." />
            </div>
            <div className="user-profile">
              <div className="user-text">
                <span className="user-name">{keycloak.tokenParsed?.preferred_username}</span>
                <span className="user-role">{keycloak.hasRealmRole('admin') ? 'Administrateur' : 'Utilisateur'}</span>
              </div>
              <div className="avatar">
                {keycloak.tokenParsed?.preferred_username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
          <section className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicules" element={<Vehicules />} />
              <Route path="/conducteurs" element={<Conducteurs />} />
              <Route path="/localisation" element={<Localisation />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </section>
        </main>
      </div>
    </Router>
  );
}

export default App;
