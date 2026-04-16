import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Maintenance terminée',
    message: 'Le véhicule V-102 a terminé sa révision annuelle.',
    time: 'Il y a 1 heure',
    read: false
  },
  {
    id: '2',
    type: 'info',
    title: 'Nouveau conducteur',
    message: 'Marc Durand a été ajouté à votre équipe.',
    time: 'Il y a 3 heures',
    read: true
  },
  {
    id: '3',
    type: 'warning',
    title: 'Renouvellement permis',
    message: 'Le permis de Luc Lefebvre expire dans 30 jours.',
    time: 'Hier',
    read: true
  }
];

const Notifications: React.FC = () => {
  return (
    <div className="notifications-page">
      <header className="page-header">
        <div className="title-section">
          <h1>Notifications</h1>
          <span className="unread-count">1 non lue</span>
        </div>
        <p className="subtitle">Restez informé des événements importants de votre flotte.</p>
      </header>

      <div className="notifications-list">
        {notifications.map(n => (
          <div key={n.id} className={`notification-card ${n.read ? 'read' : 'unread'}`}>
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
            {!n.read && <div className="unread-dot"></div>}
          </div>
        ))}
      </div>
      
      <button className="btn-secondary-full">Tout marquer comme lu</button>
    </div>
  );
};

export default Notifications;
