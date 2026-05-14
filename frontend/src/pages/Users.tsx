import { useEffect, useState, useCallback } from 'react';
import { User, Shield, Mail, Search, MoreVertical, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import './Users.css';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
}

interface UserForm {
  username: string;
  email: string;
  roles: string;
  firstName: string;
  lastName: string;
}

const EMPTY_FORM: UserForm = { username: '', email: '', roles: 'utilisateur', firstName: '', lastName: '' };

export default function Users() {
  const [users, setUsers]     = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal état
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [form, setForm]             = useState<UserForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [openMenu, setOpenMenu]     = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<UserProfile[]>('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => { setForm(EMPTY_FORM); setShowCreate(true); };
  const openEdit = (u: UserProfile) => {
    setEditTarget(u);
    setForm({ 
      username: u.username, 
      email: u.email, 
      roles: u.roles.join(','), 
      firstName: u.firstName, 
      lastName: u.lastName 
    });
    setOpenMenu(null);
  };
  const closeModal = () => { setShowCreate(false); setEditTarget(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', { ...form, roles: form.roles.split(',').map(r => r.trim()) });
      closeModal();
      fetchUsers();
    } catch {
      alert('Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await api.put(`/users/${editTarget.id}`, { ...form, roles: form.roles.split(',').map(r => r.trim()) });
      closeModal();
      fetchUsers();
    } catch {
      alert('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: UserProfile) => {
    if (!confirm(`Supprimer l'utilisateur ${u.username} ?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      fetchUsers();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

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
        <div className="header-actions">
          <button className="btn-icon" onClick={fetchUsers} title="Rafraîchir">
            <RefreshCw size={16} />
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nouveau utilisateur
          </button>
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
              <div className="user-actions">
                <button className="btn-more" onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}>
                  <MoreVertical size={16} />
                </button>
                {openMenu === u.id && (
                  <div className="actions-dropdown">
                    <button onClick={() => openEdit(u)}><Pencil size={14} /> Modifier</button>
                    <button className="danger" onClick={() => handleDelete(u)}><Trash2 size={14} /> Supprimer</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création */}
      <Modal isOpen={showCreate} title="Nouvel utilisateur" onClose={closeModal}>
        <form onSubmit={handleCreate} className="user-form">
          <UserFormFields form={form} onChange={handleChange} />
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Édition */}
      <Modal isOpen={!!editTarget} title="Modifier l'utilisateur" onClose={closeModal}>
        <form onSubmit={handleUpdate} className="user-form">
          <UserFormFields form={form} onChange={handleChange} />
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function UserFormFields({ form, onChange }: { 
  form: UserForm; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>Prénom</label>
          <input name="firstName" value={form.firstName} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label>Nom</label>
          <input name="lastName" value={form.lastName} onChange={onChange} required />
        </div>
      </div>
      <div className="form-group">
        <label>Nom d'utilisateur</label>
        <input name="username" value={form.username} onChange={onChange} required />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={onChange} required />
      </div>
      <div className="form-group">
        <label>Rôles (séparés par des virgules)</label>
        <select name="roles" value={form.roles} onChange={onChange} className="form-select">
          <option value="utilisateur">Conducteur</option>
          <option value="technicien">Technicien</option>
          <option value="manager">Manager</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>
    </>
  );
}
