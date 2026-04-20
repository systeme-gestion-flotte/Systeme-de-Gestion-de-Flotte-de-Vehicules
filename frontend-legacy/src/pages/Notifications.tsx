import { useState, useEffect, useCallback } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import api from '../api';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get<any[]>('/alerts');
      const mapped: Notification[] = resp.data.map(a => ({
        id: String(a.id || a.id_alerte || Math.random()),
        type: a.severite === 'CRITIQUE' ? 'warning' : 'info',
        title: a.type_alerte || 'Alerte Système',
        message: a.message || 'Aucun détail fourni.',
        time: a.created_at ? new Date(a.created_at).toLocaleString() : 'Récemment',
        read: false
      }));
      setNotifs(mapped);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markAsRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = async (id: string) => {
    try {
      await api.delete(`/alerts/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch {
      alert('Erreur lors de la suppression de l\'alerte.');
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <header className="page-header">
        <div className="title-section">
          <h1>Notifications</h1>
          <span className="unread-count">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="header-actions">
           <button className="btn-icon" onClick={fetchAlerts} title="Actualiser"><RefreshCw size={18} /></button>
           <button className="btn-secondary" onClick={markAllAsRead} disabled={unreadCount === 0}>
             Tout marquer comme lu
           </button>
        </div>
      </header>

      {loading && <div className="loading-state">Chargement des alertes…</div>}

      <div className="notifications-list">
        {notifs.length === 0 && !loading && (
          <div className="empty-state">
            <Bell size={40} color="#94a3b8" />
            <p>Aucune notification pour le moment.</p>
          </div>
        )}
        {notifs.map(n => (
          <div key={n.id} className={`notification-card ${n.read ? 'read' : 'unread'}`} onClick={() => markAsRead(n.id)}>
            <div className={`notif-icon-box ${n.type}`}>
               {n.type === 'success' && <CheckCircle size={20} />}
               {n.type === 'info' && <Info size={20} />}
               {n.type === 'warning' && <AlertTriangle size={20} />}
            </div>
            <div className="notif-content">
              <div className="notif-header">
                <h3>{n.title}</h3>
                <span className="notif-time">{n.time}</span>
              </div>
              <p className="notif-message">{n.message}</p>
            </div>
            <div className="notif-actions">
              <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }} title="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
            {!n.read && <div className="unread-dot"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
