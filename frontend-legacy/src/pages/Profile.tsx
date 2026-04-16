import React from 'react';
import { User, Mail, Shield, Smartphone, LogOut } from 'lucide-react';
import keycloak from '../auth';
import './Profile.css';

const Profile: React.FC = () => {
  const user = {
    username: keycloak.tokenParsed?.preferred_username || 'Utilisateur',
    email: keycloak.tokenParsed?.email || 'non renseigné',
    firstName: keycloak.tokenParsed?.given_name || '',
    lastName: keycloak.tokenParsed?.family_name || '',
    roles: (keycloak.tokenParsed?.realm_access?.roles || []).filter((r: string) => 
        ['admin', 'manager', 'technicien', 'utilisateur'].includes(r)
    )
  };

  return (
    <div className="profile-page">
      <header className="page-header">
        <h1>Mon Profil</h1>
        <p className="subtitle">Gérez vos informations personnelles et vos préférences.</p>
      </header>

      <div className="profile-container">
        <div className="profile-card main-info">
          <div className="profile-avatar-section">
            <div className="avatar-xl">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="profile-name-header">
              <h2>{user.firstName} {user.lastName}</h2>
              <span className="badge-role">{user.roles[0]?.toUpperCase() || 'CONDUCTEUR'}</span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <User className="icon" size={20} />
              <div className="detail-text">
                <label>Nom d'utilisateur</label>
                <span>{user.username}</span>
              </div>
            </div>
            <div className="detail-item">
              <Mail className="icon" size={20} />
              <div className="detail-text">
                <label>Adresse e-mail</label>
                <span>{user.email}</span>
              </div>
            </div>
            <div className="detail-item">
              <Shield className="icon" size={20} />
              <div className="detail-text">
                <label>Rôles assignés</label>
                <div className="roles-list">
                    {user.roles.map((r: string) => <span key={r} className="role-tag">{r}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-sections-grid">
          <div className="profile-card">
            <h3>Paramètres de compte</h3>
            <div className="settings-list">
              <button className="settings-btn">Changer le mot de passe</button>
              <button className="settings-btn">Activer la double authentification</button>
            </div>
          </div>
          
          <div className="profile-card">
            <h3>Préférences</h3>
            <div className="settings-list">
              <label className="toggle-setting">
                <span>Notifications Email</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="toggle-setting">
                <span>Mode Sombre</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </div>
        </div>

        <button className="btn-logout-alt" onClick={() => keycloak.logout()}>
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Profile;
