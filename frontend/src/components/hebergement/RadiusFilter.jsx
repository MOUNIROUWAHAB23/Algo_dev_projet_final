import React from 'react';
import { MapPin } from 'lucide-react';

export const RadiusFilter = ({ value, onChange }) => {
  const options = [1, 5, 10, 25, 50, 'TOUS'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
      <MapPin size={20} color="#2563eb" />
      <label htmlFor="radius" style={{ fontWeight: 'bold' }}>Rayon :</label>
      <select 
        id="radius"
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt === 'TOUS' ? 'Toute la France (Vue Globale)' : `${opt} km`}
          </option>
        ))}
      </select>
    </div>
  );
};