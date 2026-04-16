import { useEffect, useState } from 'react';
import { User, Shield, Mail, Search, MoreVertical } from 'lucide-react';
import api from '../api';
import './Users.css';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
}

export default function Users() {
  const [users, setUsers]     = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get<UserProfile[]>('/users')
      .then(({ data }) => setUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p className="subtitle">Consultez les membres de l'équipe et leurs permissions</p>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur (nom, email...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement des utilisateurs…</div>
      ) : (
        <div className="users-grid">
          {filtered.map(u => (
            <div key={u.id} className="user-card">
              <div className="user-avatar">
                {u.firstName[0]}{u.lastName[0]}
              </div>
              <div className="user-details">
                <h3>{u.firstName} {u.lastName}</h3>
                <div className="user-info">
                  <User size={14} /> <span>{u.username}</span>
                </div>
                <div className="user-info">
                  <Mail size={14} /> <span>{u.email}</span>
                </div>
              </div>
              <div className="user-roles">
                {u.roles.map(r => (
                  <span key={r} className={`role-badge ${r}`}>
                    <Shield size={10} /> {r}
                  </span>
                ))}
              </div>
              <button className="btn-more">
                <MoreVertical size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
