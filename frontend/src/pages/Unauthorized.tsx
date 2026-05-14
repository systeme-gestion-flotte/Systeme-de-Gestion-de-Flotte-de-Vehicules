import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div
      data-testid="unauthorized-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '20px',
        textAlign: 'center',
      }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(239,68,68,0.15)',
        border: '2px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ShieldOff size={36} color="#ef4444" />
      </div>

      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
          Accès refusé
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '360px', margin: '0 auto' }}>
          Vous ne disposez pas des droits nécessaires pour accéder à cette page.
          Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
      </div>

      <button
        onClick={() => navigate('/', { replace: true })}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px',
          background: '#6366f1', color: '#fff',
          border: 'none', borderRadius: '8px',
          fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
        }}
        data-testid="back-home-btn"
      >
        <ArrowLeft size={16} /> Retour au tableau de bord
      </button>
    </div>
  );
}
