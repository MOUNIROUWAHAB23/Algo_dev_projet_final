import React from 'react';
import { TYPE_COLORS } from '../../utils/mapIcons';

const LEGEND_ITEMS = [
  { label: "Hôtel", color: TYPE_COLORS.HOTEL },
  { label: "Camping", color: TYPE_COLORS.CAMPING },
  { label: "Résidence", color: TYPE_COLORS.RESIDENCE },
  { label: "Auberge", color: TYPE_COLORS.AUBERGE },
  { label: "Village", color: TYPE_COLORS.VILLAGE },
];

export const MapLegend = () => {
  return (
    <div className="flex flex-wrap gap-4 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 mb-4">
      <span className="font-semibold text-gray-700 border-r border-gray-200 pr-4">Légende :</span>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <span 
            className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};