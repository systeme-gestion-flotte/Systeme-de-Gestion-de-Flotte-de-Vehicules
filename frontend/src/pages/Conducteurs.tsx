import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import './Conducteurs.css';

import keycloak from '../auth';

interface Conducteur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroPermis: string;
  categorie: string[];
  dateValiditePermis: string;
  actif: boolean;
}

interface ConducteurForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroPermis: string;
  categorie: string;
  dateValiditePermis: string;
}

const EMPTY_FORM: ConducteurForm = {
  nom: '', prenom: '', email: '', telephone: '',
  numeroPermis: '', categorie: 'B', dateValiditePermis: '',
};

const isAdmin = () => keycloak.hasRealmRole('admin');
const isManager = () => keycloak.hasRealmRole('manager');
const canWrite = () => isAdmin() || isManager();

export default function Conducteurs() {
  const [conducteurs, setConducteurs]   = useState<Conducteur[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Conducteur | null>(null);
  const [form, setForm]                 = useState<ConducteurForm>(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [search, setSearch]             = useState('');
  
  // Custom UI feedback states
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ msg: string; action: () => void } | null>(null);

  const showToast = (msg: string, type: 'error' | 'success' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getErrorMsg = (err: any, fallback: string) => {
    const msg = err.response?.data?.message || err.response?.data?.detail;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return fallback;
  };

  const fetchConducteurs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const resp = await api.get<any>('/conducteurs');
      let rawData = [];
      if (resp.data) {
        if (Array.isArray(resp.data)) {
          rawData = resp.data;
        } else if (resp.data.data && Array.isArray(resp.data.data)) {
          rawData = resp.data.data;
        }
      }

      const mapped = rawData.map((c: any) => ({
        id: String(c.idConducteur || c.id_conducteur || c.id || Math.random()),
        nom: c.nom || 'Inconnu',
        prenom: c.prenom || 'Inconnu',
        email: c.email || '—',
        telephone: c.telephone || '—',
        numeroPermis: c.numero_permis || c.numeroPermis || '—',
        categorie: Array.isArray(c.categorie) ? c.categorie : [c.categorie || 'B'],
        dateValiditePermis: c.date_validite_permis || c.dateValiditePermis || '',
        actif: c.actif !== undefined ? c.actif : true
      }));
      setConducteurs(mapped);
    } catch (err) {
      console.error('Fetch conducteurs error:', err);
      setError('Impossible de charger les conducteurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConducteurs(); }, [fetchConducteurs]);

  const openCreate = () => { setForm(EMPTY_FORM); setShowCreate(true); };
  const openEdit   = (c: Conducteur) => {
    setEditTarget(c);
    setForm({
      nom: c.nom, prenom: c.prenom, email: c.email, telephone: c.telephone,
      numeroPermis: c.numeroPermis, categorie: c.categorie[0] || 'B',
      dateValiditePermis: c.dateValiditePermis?.slice(0, 10) ?? '',
    });
  };
  const closeModal = () => { setShowCreate(false); setEditTarget(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, categorie: [form.categorie] };
    try {
      await api.post('/conducteurs', payload);
      closeModal(); fetchConducteurs(); 
      showToast('Conducteur créé avec succès !');
    } catch (err) { showToast(getErrorMsg(err, 'Erreur lors de la création.'), 'error'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    const payload = { ...form, categorie: [form.categorie] };
    try {
      if (!editTarget.id || editTarget.id.includes('0.')) throw new Error('ID invalide');
      await api.put(`/conducteurs/${editTarget.id}`, payload);
      closeModal(); fetchConducteurs();
      showToast('Conducteur modifié avec succès !');
    } catch (err) { showToast(getErrorMsg(err, 'Erreur lors de la mise à jour.'), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = (c: Conducteur) => {
    setConfirmDialog({
      msg: `Voulez-vous vraiment désactiver ${c.prenom} ${c.nom} ?`,
      action: async () => {
        setConfirmDialog(null);
        try {
          if (!c.id || c.id.includes('0.')) throw new Error('ID invalide');
          await api.delete(`/conducteurs/${c.id}`);
          fetchConducteurs();
          showToast('Conducteur supprimé.', 'success');
        } catch (err) { showToast(getErrorMsg(err, 'Erreur lors de la suppression.'), 'error'); }
      }
    });
  };

  const filtered = conducteurs.filter(c =>
    `${c.nom} ${c.prenom} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const expirationColor = (date: string) => {
    if (!date) return '#94a3b8';
    const diff = new Date(date).getTime() - Date.now();
    const days = diff / 86_400_000;
    if (days < 0)   return '#ef4444';
    if (days < 30)  return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="conducteurs-page">
      <div className="page-header">
        <div>
          <h1>Gestion des Conducteurs</h1>
          <p className="subtitle">{conducteurs.length} conducteur{conducteurs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            placeholder="Rechercher un conducteur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="search-conducteur"
          />
          <button className="btn-icon" onClick={fetchConducteurs} title="Rafraîchir"><RefreshCw size={16} /></button>
          <button className="btn-primary" onClick={openCreate} data-testid="btn-create-conducteur">
            <Plus size={16} /> Nouveau conducteur
          </button>
        </div>
      </div>

      {loading && <div className="loading-state">Chargement…</div>}
      {error   && <div className="error-state">{error}</div>}

      {!loading && !error && (
        <div className="conducteurs-grid" data-testid="conducteurs-grid">
          {filtered.length === 0 && (
            <p style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
              Aucun conducteur trouvé
            </p>
          )}
          {filtered.map(c => (
            <div key={c.id} className="conducteur-card" data-testid={`conducteur-card-${c.id}`}>
              <div className="card-header">
                <div className="avatar-lg">{c.prenom.charAt(0)}{c.nom.charAt(0)}</div>
                <div className="card-actions">
                  {canWrite() && (
                    <>
                      <button className="btn-icon" onClick={() => openEdit(c)} title="Modifier"><Pencil size={14} /></button>
                      {isAdmin() && <button className="btn-icon danger" onClick={() => handleDelete(c)} title="Désactiver"><Trash2 size={14} /></button>}
                    </>
                  )}
                </div>
              </div>
              <h3 className="card-name">{c.prenom} {c.nom}</h3>
              <p className="card-email">{c.email}</p>
              <p className="card-phone">{c.telephone}</p>
              <div className="card-permis">
                <span className="permis-label">Permis {c.categorie.join(', ')}</span>
                <span className="permis-num">{c.numeroPermis}</span>
                <span className="permis-exp" style={{ color: expirationColor(c.dateValiditePermis) }}>
                  Exp. {c.dateValiditePermis ? new Date(c.dateValiditePermis).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
              <div className="card-status"><StatusBadge status={c.actif} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      <Modal isOpen={showCreate} title="Nouveau conducteur" onClose={closeModal} width="600px">
        <form onSubmit={handleCreate} className="conducteur-form" data-testid="create-conducteur-form">
          <ConducteurFormFields form={form} onChange={handleChange} />
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal édition */}
      <Modal isOpen={!!editTarget} title="Modifier le conducteur" onClose={closeModal} width="600px">
        <form onSubmit={handleUpdate} className="conducteur-form" data-testid="edit-conducteur-form">
          <ConducteurFormFields form={form} onChange={handleChange} />
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal isOpen={!!confirmDialog} title="Confirmation" onClose={() => setConfirmDialog(null)} width="400px">
        <p style={{ padding: '10px 0', fontSize: '15px' }}>{confirmDialog?.msg}</p>
        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="btn-secondary" onClick={() => setConfirmDialog(null)}>Annuler</button>
          <button type="button" className="btn-primary danger" style={{ background: '#ef4444' }} onClick={confirmDialog?.action}>Désactiver</button>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#991b1b' : '#166534',
          padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#86efac'}`,
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ConducteurFormFields({ form, onChange }: {
  form: ConducteurForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>Prénom</label>
          <input name="prenom" value={form.prenom} onChange={onChange} placeholder="Jean" required data-testid="input-prenom" />
        </div>
        <div className="form-group">
          <label>Nom</label>
          <input name="nom" value={form.nom} onChange={onChange} placeholder="Dupont" required data-testid="input-nom" />
        </div>
      </div>
      <div className="form-group">
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={onChange} placeholder="jean.dupont@example.com" required data-testid="input-email" />
      </div>
      <div className="form-group">
        <label>Téléphone</label>
        <input name="telephone" value={form.telephone} onChange={onChange} placeholder="0612345678" data-testid="input-telephone" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Numéro de permis</label>
          <input name="numeroPermis" value={form.numeroPermis} onChange={onChange} placeholder="12AB34567" required data-testid="input-permis" />
        </div>
        <div className="form-group">
          <label>Catégorie</label>
          <select name="categorie" value={form.categorie} onChange={onChange} className="form-select" data-testid="select-categorie">
            {['A', 'B', 'C', 'D', 'BE', 'CE'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Date de validité du permis</label>
        <input name="dateValiditePermis" type="date" value={form.dateValiditePermis} onChange={onChange} required data-testid="input-expiration" />
      </div>
    </>
  );
}
