import { useState } from 'react';
import { Car, Eye, EyeOff } from 'lucide-react';
import { loginWithCredentials } from '../auth';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPwd]  = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithCredentials(username, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Orbes décoratifs */}
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo-box">
            <Car size={30} color="#fff" />
          </div>
          <h1 className="login-brand">FleetX</h1>
          <p className="login-tagline">Système de gestion de flotte de véhicules</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="username">Identifiant</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre identifiant"
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Mot de passe</label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="login-spinner" />
                Connexion en cours…
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <p className="login-footer">
          Accès réservé aux utilisateurs autorisés
        </p>
      </div>
    </div>
  );
}
