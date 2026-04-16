import React, { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCw, CheckCircle, XCircle, Wrench } from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import keycloak from '../auth';
import './Maintenance.css';

interface Intervention {
  id: string;
  vehiculeId: string;
  immatriculation?: string;
  typeIntervention: string;
  description: string;
  dateDebut: string;
  dateFin?: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  technicienId?: string;
  cout?: number;
}

interface InterventionForm {
  vehiculeId: string;
  typeIntervention: string;
  description: string;
  dateDebut: string;
  technicienId: string;
}

const EMPTY_FORM: InterventionForm = {
  vehiculeId: '', typeIntervention: 'REVISION', description: '', dateDebut: '', technicienId: '',
};

const canWrite = () => keycloak.hasRealmRole('admin') || keycloak.hasRealmRole('technicien') || keycloak.hasRealmRole('manager');

const TYPES = ['REVISION', 'REPARATION', 'CONTROLE_TECHNIQUE', 'NETTOYAGE', 'PNEUS', 'AUTRE'];
const STATUTS = ['ALL', 'PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

export default function Maintenance() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm]                   = useState<InterventionForm>(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [filterStatut, setFilterStatut]   = useState('ALL');

  const fetchInterventions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const resp = await api.get<any>('/maintenance/interventions');
      // Pour FastAPI qui renvoie {data: [], total: 0} ou simplement []
      let rawData = [];
      if (resp.data) {
        if (Array.isArray(resp.data)) {
          rawData = resp.data;
        } else if (resp.data.data && Array.isArray(resp.data.data)) {
          rawData = resp.data.data;
        }
      }
      
      const mapped = rawData.map((i: any) => ({
        id: String(i.id_intervention || i.id || Math.random()),
        vehiculeId: String(i.vehicule_id || i.vehiculeId || 'Inconnu'),
        immatriculation: i.immatriculation || i.vehicule_immat || '—',
        typeIntervention: i.type_intervention || i.typeIntervention || 'AUTRE',
        description: i.description || '',
        dateDebut: i.date_debut || i.date_planifiee || i.dateDebut || new Date().toISOString(),
        dateFin: i.date_fin || i.dateFin,
        statut: (i.statut || 'PLANIFIEE').toUpperCase(),
        technicienId: i.technicien_id || i.technicienId,
        cout: i.cout ? Number(i.cout) : 0
      }));
      setInterventions(mapped);
    } catch (err) {
      console.error('Fetch interventions error:', err);
      setError('Impossible de charger les interventions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInterventions(); }, [fetchInterventions]);

  const closeModal = () => { setShowCreate(false); setForm(EMPTY_FORM); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/maintenance/interventions', form);
      closeModal(); fetchInterventions();
    } catch { alert('Erreur lors de la création.'); }
    finally { setSaving(false); }
  };

  const handleChangeStatut = async (id: string, statut: string) => {
    try {
      await api.patch(`/maintenance/interventions/${id}/statut`, { statut });
      fetchInterventions();
    } catch { alert('Erreur changement de statut.'); }
  };

  const filtered = filterStatut === 'ALL'
    ? interventions
    : interventions.filter(i => i.statut === filterStatut);

  const stats = {
    total:     interventions.length,
    planifiee: interventions.filter(i => i.statut === 'PLANIFIEE').length,
    en_cours:  interventions.filter(i => i.statut === 'EN_COURS').length,
    terminee:  interventions.filter(i => i.statut === 'TERMINEE').length,
  };

  return (
    <div className="maintenance-page">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1>Maintenance</h1>
          <p className="subtitle">{stats.total} intervention{stats.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={fetchInterventions} title="Rafraîchir"><RefreshCw size={16} /></button>
          {canWrite() && (
            <button className="btn-primary" onClick={() => setShowCreate(true)} data-testid="btn-create-intervention">
              <Plus size={16} /> Nouvelle intervention
            </button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-row">
        <KpiCard label="Planifiées" value={stats.planifiee} color="#6366f1" />
        <KpiCard label="En cours"   value={stats.en_cours}  color="#3b82f6" />
        <KpiCard label="Terminées"  value={stats.terminee}  color="#10b981" />
      </div>

      {/* Filtre */}
      <div className="filter-bar">
        {STATUTS.map(s => (
          <button
            key={s}
            className={'filter-btn' + (filterStatut === s ? ' active' : '')}
            onClick={() => setFilterStatut(s)}
          >
            {s === 'ALL' ? 'Toutes' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading && <div className="loading-state">Chargement…</div>}
      {error   && <div className="error-state">{error}</div>}

      {!loading && !error && (
        <div className="interventions-list" data-testid="interventions-list">
          {filtered.length === 0 && (
            <div className="empty-state">
              <Wrench size={40} color="#334155" />
              <p>Aucune intervention</p>
            </div>
          )}
          {filtered.map(i => (
            <InterventionCard
              key={i.id}
              intervention={i}
              onChangeStatut={handleChangeStatut}
              canWrite={canWrite()}
            />
          ))}
        </div>
      )}

      {/* Modal création */}
      <Modal isOpen={showCreate} title="Nouvelle intervention" onClose={closeModal} width="560px">
        <form onSubmit={handleCreate} className="intervention-form" data-testid="create-intervention-form">
          <div className="form-group">
            <label>Véhicule (ID)</label>
            <input name="vehiculeId" value={form.vehiculeId} onChange={handleChange}
              placeholder="UUID du véhicule" required data-testid="input-vehicule-id" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="typeIntervention" value={form.typeIntervention} onChange={handleChange} className="form-select">
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date de début</label>
              <input name="dateDebut" type="datetime-local" value={form.dateDebut} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Décrivez l'intervention…" data-testid="input-description" />
          </div>
          <div className="form-group">
            <label>Technicien (ID, optionnel)</label>
            <input name="technicienId" value={form.technicienId} onChange={handleChange}
              placeholder="UUID du technicien" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ── Carte intervention ── */
function InterventionCard({ intervention: i, onChangeStatut, canWrite }: {
  intervention: Intervention;
  onChangeStatut: (id: string, statut: string) => void;
  canWrite: boolean;
}) {
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Date invalide';
      return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'Erreur date';
    }
  };

  return (
    <div className="intervention-card" data-testid={`intervention-card-${i.id}`}>
      <div className="intervention-header">
        <div className="intervention-meta">
          <span className="intervention-type">{(i.typeIntervention || 'AUTRE').replace('_', ' ')}</span>
          <StatusBadge status={i.statut} />
        </div>
        {canWrite && (
          <div className="statut-actions">
            {i.statut === 'PLANIFIEE' && (
              <button className="statut-btn start" onClick={() => onChangeStatut(i.id, 'EN_COURS')}
                title="Démarrer" data-testid="btn-start-intervention">
                <CheckCircle size={14} /> Démarrer
              </button>
            )}
            {i.statut === 'EN_COURS' && (
              <button className="statut-btn finish" onClick={() => onChangeStatut(i.id, 'TERMINEE')}
                title="Terminer" data-testid="btn-finish-intervention">
                <CheckCircle size={14} /> Terminer
              </button>
            )}
            {(i.statut === 'PLANIFIEE' || i.statut === 'EN_COURS') && (
              <button className="statut-btn cancel" onClick={() => onChangeStatut(i.id, 'ANNULEE')}
                title="Annuler" data-testid="btn-cancel-intervention">
                <XCircle size={14} /> Annuler
              </button>
            )}
          </div>
        )}
      </div>
      <p className="intervention-desc">{i.description || <em style={{ color: '#64748b' }}>Aucune description</em>}</p>
      <div className="intervention-footer">
        {i.immatriculation && <span className="immat-tag">{i.immatriculation}</span>}
        <span className="date-tag">Début : {formatDate(i.dateDebut)}</span>
        {i.dateFin && <span className="date-tag">Fin : {formatDate(i.dateFin)}</span>}
        {i.cout != null && <span className="cost-tag">{Number(i.cout).toFixed(2)} €</span>}
      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="kpi-card">
      <span className="kpi-value" style={{ color }}>{value}</span>
      <span className="kpi-label">{label}</span>
    </div>
  );
}
