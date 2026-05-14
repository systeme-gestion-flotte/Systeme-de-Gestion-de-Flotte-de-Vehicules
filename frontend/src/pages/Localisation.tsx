import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { Navigation, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import api from '../api';
import keycloak from '../auth';
import './Localisation.css';

// Fix Leaflet default icon with Vite/bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon colors per statut
const makeIcon = (color: string) => new L.DivIcon({
  className: '',
  html: `<div style="
    width:28px; height:28px; border-radius:50%;
    background:${color}; border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center;
  "><svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const ICON_MAP: Record<string, L.DivIcon> = {
  DISPONIBLE:     makeIcon('#10b981'),
  EN_COURSE:      makeIcon('#3b82f6'),
  EN_MAINTENANCE: makeIcon('#f59e0b'),
  DEFAULT:        makeIcon('#6366f1'),
};

interface VehiculePosition {
  vehiculeId: string;
  immatriculation: string;
  statut: string;
  latitude: number;
  longitude: number;
  vitesse: number;
  timestamp: string;
}

// Geofencing zones matching the backend (Circles)
const ZONES = [
  { 
    lat: 49.44, 
    lng: 1.09, 
    radius: 7000, 
    label: 'Agglomération de Rouen', 
    color: '#3b82f6', 
    type: 'AUTORISEE' 
  },
  { 
    lat: 49.42, 
    lng: 1.09, 
    radius: 800, 
    label: 'Zone Industrielle Interdite', 
    color: '#ef4444', 
    type: 'INTERDITE' 
  },
  { 
    lat: 49.43, 
    lng: 1.05, 
    radius: 1000, 
    label: 'Port de Rouen — Zone Restreinte', 
    color: '#ef4444', 
    type: 'INTERDITE' 
  },
];

// Component to auto-fit map bounds
function FitBounds({ positions }: { positions: VehiculePosition[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function Localisation() {
  const [positions, setPositions]     = useState<VehiculePosition[]>([]);
  const [connected, setConnected]     = useState(false);
  const [selected, setSelected]       = useState<string | null>(null);
  const socketRef                     = useRef<Socket | null>(null);

  // Charger les dernières positions via REST
  const fetchLatest = useCallback(() => {
    api.get<any[]>('/localisation/positions/latest')
      .then(({ data }) => {
        let mapped = data.map(p => ({
          vehiculeId: p.vehicule_id,
          immatriculation: p.immatriculation || p.vehicule_id, // use joined immat if available
          statut: 'EN_COURSE',
          latitude: p.latitude,
          longitude: p.longitude,
          vitesse: p.vitesse,
          timestamp: p.horodatage
        }));

        // SIMULATION: Un conducteur ne voit que la position de son propre véhicule
        if (keycloak.hasRealmRole('utilisateur') && mapped.length > 0) {
          mapped = [mapped[0]];
        }

        setPositions(mapped);
      })
      .catch(() => {}); // silently ignore if endpoint not ready
  }, []);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  // Socket.IO — mises à jour temps réel
  useEffect(() => {
    const socket = io('http://localhost:3002', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('position_update', (data: any) => {
      const mapped: VehiculePosition = {
        vehiculeId: data.vehicule_id,
        immatriculation: data.vehicule_id,
        statut: 'EN_COURSE',
        latitude: data.latitude,
        longitude: data.longitude,
        vitesse: data.vitesse,
        timestamp: data.horodatage
      };
      setPositions(prev => {
        // Filtrage conducteur pour les événements Websocket
        if (keycloak.hasRealmRole('utilisateur')) {
          if (prev.length > 0 && prev[0].vehiculeId !== mapped.vehiculeId) {
            return prev;
          }
        }

        const idx = prev.findIndex(p => p.vehiculeId === mapped.vehiculeId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = mapped;
          return next;
        }
        return [...prev, mapped];
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const selectedPos = positions.find(p => p.vehiculeId === selected);

  return (
    <div className="localisation-page">
      {/* En-tête */}
      <div className="loc-header">
        <div>
          <h1>Suivi en temps réel</h1>
          <p className="subtitle">{positions.length} véhicule{positions.length !== 1 ? 's' : ''} localisé{positions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={fetchLatest} title="Rafraîchir" style={{ marginRight: '1rem' }}>
            <RefreshCw size={16} />
          </button>
          <div className={`conn-badge ${connected ? 'connected' : 'disconnected'}`} data-testid="ws-status">
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connected ? 'Connecté' : 'Hors ligne'}
          </div>
        </div>
      </div>

      <div className="loc-layout">
        {/* Carte Leaflet */}
        <div className="map-wrapper" data-testid="leaflet-map">
          <MapContainer
            center={[49.4431, 1.0993]}
            zoom={12}
            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />

            {/* Zones géographiques (Cercles) */}
            {ZONES.map((z, i) => (
              <Circle
                key={i}
                center={[z.lat, z.lng]}
                radius={z.radius}
                pathOptions={{ 
                  color: z.color, 
                  fillColor: z.color, 
                  fillOpacity: z.type === 'AUTORISEE' ? 0.05 : 0.2, 
                  weight: 2,
                  dashArray: z.type === 'AUTORISEE' ? '5, 10' : ''
                }}
              >
                <Popup>{z.label}</Popup>
              </Circle>
            ))}

            {/* Marqueurs véhicules */}
            {positions.map(p => (
              <Marker
                key={p.vehiculeId}
                position={[p.latitude, p.longitude]}
                icon={ICON_MAP[p.statut] ?? ICON_MAP.DEFAULT}
                eventHandlers={{ click: () => setSelected(p.vehiculeId) }}
              >
                <Popup>
                  <div style={{ minWidth: '160px' }}>
                    <strong style={{ color: '#1e293b' }}>{p.immatriculation}</strong>
                    <br />
                    Statut: {p.statut}
                    <br />
                    Vitesse: <strong>{p.vitesse ?? 0} km/h</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>
                      {new Date(p.timestamp).toLocaleTimeString('fr-FR')}
                    </small>
                  </div>
                </Popup>
              </Marker>
            ))}

            {positions.length > 0 && <FitBounds positions={positions} />}
          </MapContainer>
        </div>

        {/* Panneau latéral */}
        <div className="loc-sidebar">
          <h3>Véhicules</h3>
          <div className="vehicle-list">
            {positions.length === 0 && (
              <p className="empty-msg">En attente de données GPS…</p>
            )}
            {positions.map(p => (
              <div
                key={p.vehiculeId}
                className={`vehicle-item ${selected === p.vehiculeId ? 'selected' : ''}`}
                onClick={() => setSelected(p.vehiculeId === selected ? null : p.vehiculeId)}
                data-testid={`vehicle-item-${p.vehiculeId}`}
              >
                <div className="vehicle-dot" style={{
                  background: p.statut === 'DISPONIBLE' ? '#10b981'
                    : p.statut === 'EN_COURSE' ? '#3b82f6' : '#f59e0b'
                }} />
                <div className="vehicle-info">
                  <span className="vehicle-immat">{p.immatriculation}</span>
                  <span className="vehicle-speed"><Navigation size={12} /> {p.vitesse ?? 0} km/h</span>
                </div>
                <span className="vehicle-time">
                  {new Date(p.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          {/* Détails véhicule sélectionné */}
          {selectedPos && (
            <div className="vehicle-details" data-testid="vehicle-details">
              <h4>Détails</h4>
              <div className="detail-row"><span>Immat.</span><strong>{selectedPos.immatriculation}</strong></div>
              <div className="detail-row"><span>Statut</span><strong>{selectedPos.statut}</strong></div>
              <div className="detail-row"><span>Vitesse actuelle</span><strong>{selectedPos.vitesse ?? 0} km/h</strong></div>
              <div className="detail-row">
                <span>Position</span>
                <strong>{selectedPos.latitude.toFixed(5)}, {selectedPos.longitude.toFixed(5)}</strong>
              </div>
              <div className="detail-row">
                <span>Mise à jour</span>
                <strong>{new Date(selectedPos.timestamp).toLocaleTimeString('fr-FR')}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
