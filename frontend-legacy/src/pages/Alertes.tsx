import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Zap, Thermometer, Gauge, Clock, RefreshCw } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import './Alertes.css';

interface Alerte {
  id: string;
  type: 'critique' | 'attention' | 'info';
  source: string;
  message: string;
  time: string;
}

const ICON_MAP = {
  critique: Thermometer,
  attention: Zap,
  info: ShieldAlert,
  default: Gauge
};

const Alertes: React.FC = () => {
  const [alerts, setAlerts] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Alerte[]>('/alerts');
      setAlerts(data);
    } catch {
      setError('Impossible de récupérer les alertes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleDismiss = async (id: string) => {
    try {
      await api.delete(`/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      alert("Erreur lors de l'acquittement.");
    }
  };

  const getIcon = (type: string) => {
    return ICON_MAP[type as keyof typeof ICON_MAP] || ICON_MAP.default;
  };

  return (
    <div className="alertes-page">
      <header className="page-title-section">
        <div className="title-with-badge">
          <h1>Alertes & Incidents</h1>
          <span className="count-badge">{alerts.length}</span>
        </div>
        <div className="header-actions">
           <button className="btn-icon" onClick={fetchAlerts} title="Rafraîchir">
            <RefreshCw size={16} />
          </button>
        </div>
        <p>Surveillance active de l'état de la flotte et des capteurs IoT.</p>
      </header>

      {loading && <div className="loading-state">Récupération des alertes...</div>}
      {error && <div className="error-state">{error}</div>}

      <div className="alertes-list">
        {!loading && alerts.length === 0 && <p className="empty-msg">Aucune alerte active pour le moment.</p>}
        {alerts.map((alerte) => {
          const Icon = getIcon(alerte.type);
          return (
            <div key={alerte.id} className={`alerte-item ${alerte.type}`}>
              <div className="alerte-icon-wrapper">
                <Icon size={24} />
              </div>
              
              <div className="alerte-content">
                <div className="alerte-header">
                  <span className="alerte-source">{alerte.source}</span>
                  <span className="alerte-time">
                    <Clock size={14} />
                    {alerte.time}
                  </span>
                </div>
                <p className="alerte-message">{alerte.message}</p>
              </div>
              
              <div className="alerte-actions">
                <button className="btn-action" onClick={() => setSelectedAlerte(alerte)}>
                  Consulter
                </button>
                <button className="btn-dismiss" onClick={() => handleDismiss(alerte.id)}>
                  Acquitter
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Détails */}
      <Modal 
        isOpen={!!selectedAlerte} 
        title="Détails de l'incident" 
        onClose={() => setSelectedAlerte(null)}
      >
        {selectedAlerte && (
          <div className="alerte-detail-view">
             <div className={`detail-header ${selectedAlerte.type}`}>
                {React.createElement(getIcon(selectedAlerte.type), { size: 32 })}
                <h3>Alerte {selectedAlerte.type.toUpperCase()}</h3>
             </div>
             <div className="detail-body">
                <p><strong>Source :</strong> {selectedAlerte.source}</p>
                <p><strong>Message :</strong> {selectedAlerte.message}</p>
                <p><strong>Reçue :</strong> {selectedAlerte.time}</p>
                <div className="detail-info-box">
                   <p>Une intervention de maintenance a été suggérée automatiquement par le système de diagnostic.</p>
                </div>
             </div>
             <div className="detail-footer">
                <button className="btn-primary" onClick={() => setSelectedAlerte(null)}>Fermer</button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Alertes;
