import React from 'react';
import { Construction } from 'lucide-react';
import './Placeholder.css';

const Placeholder: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="placeholder-content">
      <Construction size={48} className="placeholder-icon" />
      <h2>{title}</h2>
      <p>Cette page est actuellement en cours de développement.</p>
    </div>
  );
};

export default Placeholder;
