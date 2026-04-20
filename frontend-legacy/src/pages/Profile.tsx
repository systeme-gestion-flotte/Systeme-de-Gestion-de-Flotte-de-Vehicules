import { useState } from 'react';
import { LogOut } from 'lucide-react';
import keycloak from '../auth';
import './Profile.css';

export default function Profile() {
  const user = {
    username: keycloak.tokenParsed?.preferred_username || 'Utilisateur',
    email: keycloak.tokenParsed?.email || 'email@fleet.local',
    roles: keycloak.tokenParsed?.realm_access?.roles || [],
  };

  const [toast, setToast] = useState<string | null>(null);

  const handlePasswordReset = () => {
    setToast('Un email de réinitialisation vous a été envoyé.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Mon Profil</h1>
        <p className="subtitle">Gérez vos informations personnelles et vos paramètres de sécurité.</p>
      </div>

      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar-xl">{user.username.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <div className="profile-name-header">
              <h2>{user.username}</h2>
            </div>
            <p style={{ color: '#94a3b8', margin: '4px 0' }}>{user.email}</p>
            <div className="role-badges">
              {user.roles.map((r: string) => (
                 <span key={r} className="role-tag">{r}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-sections-grid">
          <div className="profile-card">
            <h3>Sécurité</h3>
            <div className="settings-list">
              <button className="settings-btn" onClick={handlePasswordReset}>Changer le mot de passe</button>
              <button className="settings-btn" onClick={() => {
                setToast('Configuration de la double authentification envoyée par email.');
                setTimeout(() => setToast(null), 3000);
              }}>Activer la double authentification</button>
            </div>
          </div>
          
          <div className="profile-card">
            <h3>Préférences</h3>
            <div className="settings-list">
              <label className="toggle-setting">
                <span>Notifications Email</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </div>
        </div>

        <button className="btn-logout-alt" onClick={() => keycloak.logout()}>
          <LogOut size={18} /> Déconnexion
        </button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          background: '#dcfce7', color: '#166534',
          padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: `1px solid #86efac`,
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
