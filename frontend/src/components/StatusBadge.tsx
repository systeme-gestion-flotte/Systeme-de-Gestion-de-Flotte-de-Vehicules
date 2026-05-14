import React from 'react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  // Statuts véhicule
  DISPONIBLE:     { label: 'Disponible',    color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  EN_COURSE:      { label: 'En Course',     color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  EN_MAINTENANCE: { label: 'Maintenance',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  // Statuts intervention maintenance
  PLANIFIEE:      { label: 'Planifiée',     color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  EN_COURS:       { label: 'En Cours',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  TERMINEE:       { label: 'Terminée',      color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  ANNULEE:        { label: 'Annulée',       color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  // Statuts assignation conducteur
  PENDING:        { label: 'En attente',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  VALIDE:         { label: 'Validée',       color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  REJETEE:        { label: 'Rejetée',       color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  // Actif / Inactif
  true:           { label: 'Actif',         color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  false:          { label: 'Inactif',       color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
};

interface StatusBadgeProps {
  status: string | boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const key = String(status);
  const config = STATUS_CONFIG[key] ?? { label: key, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };

  return (
    <span
      data-testid="status-badge"
      style={{
        display: 'inline-block',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}55`,
        padding: '3px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
