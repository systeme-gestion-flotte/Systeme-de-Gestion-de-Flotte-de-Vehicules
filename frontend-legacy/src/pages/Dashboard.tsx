import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Zap, Map as MapIcon, RotateCw } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [positions, setPositions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeVehicles: 0,
    averageSpeed: 0,
    totalEvents: 0,
  });

  useEffect(() => {
    const socket = io('http://localhost:3002'); // Localisation Service

    socket.on('position_update', (data) => {
      setPositions((prev) => {
        const newArr = [...prev, { ...data, time: new Date().toLocaleTimeString() }].slice(-20);
        
        // Update stats
        const uniqueVehicles = new Set(newArr.map(p => p.vehicule_id)).size;
        const avgSpeed = Math.round(newArr.reduce((acc, p) => acc + (p.vitesse || 0), 0) / newArr.length);
        
        setStats({
          activeVehicles: uniqueVehicles,
          averageSpeed: avgSpeed,
          totalEvents: prev.length + 1,
        });
        
        return newArr;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <Activity color="#6366f1" />
          <div className="stat-info">
            <span className="stat-label">Véhicules Actifs</span>
            <span className="stat-value">{stats.activeVehicles}</span>
          </div>
        </div>
        <div className="stat-card">
          <Zap color="#f59e0b" />
          <div className="stat-info">
            <span className="stat-label">Vitesse Moyenne</span>
            <span className="stat-value">{stats.averageSpeed} km/h</span>
          </div>
        </div>
        <div className="stat-card">
          <MapIcon color="#10b981" />
          <div className="stat-info">
            <span className="stat-label">Dernier Véhicule</span>
            <span className="stat-value">{positions[positions.length - 1]?.vehicule_id || 'N/A'}</span>
          </div>
        </div>
        <div className="stat-card">
          <RotateCw color="#3b82f6" />
          <div className="stat-info">
            <span className="stat-label">Total Signaux</span>
            <span className="stat-value">{stats.totalEvents}</span>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Vitesse en temps réel</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={positions}>
                <defs>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="vitesse" stroke="#6366f1" fillOpacity={1} fill="url(#colorSpeed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Flux d'activité</h3>
          <div className="activity-list">
            {positions.slice().reverse().map((p, i) => (
              <div key={i} className="activity-item">
                <span className="activity-time">{p.time}</span>
                <span className="activity-text">
                  Véhicule <strong>{p.vehicule_id}</strong> a transmis sa position ({p.latitude.toFixed(4)}, {p.longitude.toFixed(4)})
                </span>
                <span className="activity-tag">{p.vitesse} km/h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
