import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import keycloak from '../auth';
import './Vehicules.css';

interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  statut: 'DISPONIBLE' | 'EN_COURSE' | 'EN_MAINTENANCE';
  actif: boolean;
}

interface VehiculeForm {
  immatriculation: string;
  marque: string;
  modele: string;
  annee: string;
}

const EMPTY_FORM: VehiculeForm = { immatriculation: '', marque: '', modele: '', annee: '' };

const isAdmin = () => keycloak.hasRealmRole('admin');
const isManager = () => keycloak.hasRealmRole('manager');
const canWrite = () => isAdmin() || isManager();

export default function Vehicules() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Modal état
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicule | null>(null);
  const [form, setForm]             = useState<VehiculeForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  // Filtre statut
  const [filterStatut, setFilterStatut] = useState<string>('ALL');

  const fetchVehicules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get<any>('/vehicules');
      // Pour Java qui renvoie parfois un objet enveloppe ou simplement []
      let rawData = [];
      if (resp.data) {
        if (Array.isArray(resp.data)) {
          rawData = resp.data;
        } else if (resp.data.data && Array.isArray(resp.data.data)) {
          rawData = resp.data.data;
        }
      }

      const mapped = rawData.map(v => ({
        id: String(v.id_vehicule || v.id || Math.random()),
        immatriculation: v.immatriculation || '—',
        marque: v.marque || '—',
        modele: v.modele || '—',
        annee: v.annee || new Date().getFullYear(),
        statut: (v.statut || 'DISPONIBLE').toUpperCase(),
        actif: v.actif !== undefined ? v.actif : true
      }));
      setVehicules(mapped);
    } catch (err) {
      console.error('Fetch Vehicles Error:', err);
      setError('Impossible de charger les véhicules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicules(); }, [fetchVehicules]);

  /* ── Helpers form ── */
  const openCreate = () => { setForm(EMPTY_FORM); setShowCreate(true); };
  const openEdit   = (v: Vehicule) => {
    setEditTarget(v);
    setForm({ immatriculation: v.immatriculation, marque: v.marque, modele: v.modele, annee: String(v.annee) });
  };
  const closeModal = () => { setShowCreate(false); setEditTarget(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  /* ── CRUD ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vehicules', { ...form, annee: Number(form.annee) });
      closeModal();
      fetchVehicules();
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
      await api.put(`/vehicules/${editTarget.id}`, { ...form, annee: Number(form.annee) });
      closeModal();
      fetchVehicules();
    } catch {
      alert('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatut = async (v: Vehicule, statut: string) => {
    try {
      await api.patch(`/vehicules/${v.id}/statut`, { statut });
      fetchVehicules();
    } catch {
      alert('Erreur changement de statut.');
    }
  };

  const handleDelete = async (v: Vehicule) => {
    if (!confirm(`Désactiver le véhicule ${v.immatriculation} ?`)) return;
    try {
      await api.delete(`/vehicules/${v.id}`);
      fetchVehicules();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  /* ── Render ── */
  const filtered = filterStatut === 'ALL'
    ? vehicules
    : vehicules.filter(v => v.statut === filterStatut);

  return (
    <div className="vehicules-page">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1>Gestion des Véhicules</h1>
          <p className="subtitle">{vehicules.length} véhicule{vehicules.length !== 1 ? 's' : ''} enregistré{vehicules.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={fetchVehicules} title="Rafraîchir">
            <RefreshCw size={16} />
          </button>
          {canWrite() && (
            <button className="btn-primary" onClick={openCreate} data-testid="btn-create-vehicule">
              <Plus size={16} /> Nouveau véhicule
            </button>
          )}
        </div>
      </div>

      {/* Filtre */}
      <div className="filter-bar">
        {['ALL', 'DISPONIBLE', 'EN_COURSE', 'EN_MAINTENANCE'].map(s => (
          <button
            key={s}
            className={'filter-btn' + (filterStatut === s ? ' active' : '')}
            onClick={() => setFilterStatut(s)}
          >
            {s === 'ALL' ? 'Tous' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading && <div className="loading-state">Chargement…</div>}
      {error   && <div className="error-state">{error}</div>}

      {!loading && !error && (
        <div className="table-wrapper" data-testid="vehicules-table">
          <table>
            <thead>
              <tr>
                <th>Immatriculation</th>
                <th>Marque / Modèle</th>
                <th>Année</th>
                <th>Statut</th>
                <th>Actif</th>
                {canWrite() && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Aucun véhicule</td></tr>
              )}
              {filtered.map(v => (
                <tr key={v.id} data-testid={`vehicule-row-${v.id}`}>
                  <td className="immat">{v.immatriculation}</td>
                  <td>{v.marque} {v.modele}</td>
                  <td>{v.annee}</td>
                  <td>
                    {canWrite() ? (
                      <select
                        className="statut-select"
                        value={v.statut}
                        onChange={e => handleChangeStatut(v, e.target.value)}
                      >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="EN_COURSE">En Course</option>
                        <option value="EN_MAINTENANCE">Maintenance</option>
                      </select>
                    ) : (
                      <StatusBadge status={v.statut} />
                    )}
                  </td>
                  <td><StatusBadge status={v.actif} /></td>
                  {canWrite() && (
                    <td className="actions-cell">
                      <button className="btn-icon" onClick={() => openEdit(v)} title="Modifier">
                        <Pencil size={15} />
                      </button>
                      <button className="btn-icon danger" onClick={() => handleDelete(v)} title="Désactiver">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création */}
      <Modal isOpen={showCreate} title="Nouveau véhicule" onClose={closeModal}>
        <form onSubmit={handleCreate} className="vehicle-form" data-testid="create-vehicule-form">
          <VehiculeFormFields form={form} onChange={handleChange} />
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal édition */}
      <Modal isOpen={!!editTarget} title="Modifier le véhicule" onClose={closeModal}>
        <form onSubmit={handleUpdate} className="vehicle-form" data-testid="edit-vehicule-form">
          <VehiculeFormFields form={form} onChange={handleChange} />
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

/* Sous-composant champs partagés */
function VehiculeFormFields({ form, onChange }: {
  form: VehiculeForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <div className="form-group">
        <label>Immatriculation</label>
        <input name="immatriculation" value={form.immatriculation} onChange={onChange}
          placeholder="AB-123-CD" required data-testid="input-immatriculation" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Marque</label>
          <input name="marque" value={form.marque} onChange={onChange}
            placeholder="Renault" required data-testid="input-marque" />
        </div>
        <div className="form-group">
          <label>Modèle</label>
          <input name="modele" value={form.modele} onChange={onChange}
            placeholder="Clio" required data-testid="input-modele" />
        </div>
      </div>
      <div className="form-group">
        <label>Année</label>
        <input name="annee" type="number" min="1990" max="2030"
          value={form.annee} onChange={onChange}
          placeholder="2023" required data-testid="input-annee" />
      </div>
    </>
  );
}
