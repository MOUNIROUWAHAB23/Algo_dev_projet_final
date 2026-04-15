import React from 'react';
import { Link } from 'react-router-dom';

export const HebergementList = ({ hebergements, loading }) => {
  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Recherche en cours...</div>;
  if (hebergements.length === 0) return <div className="p-8 text-center text-gray-500">Aucun hébergement trouvé dans cette zone.</div>;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-[calc(100vh-220px)] pr-2 pb-4 custom-scrollbar">
      {hebergements.map((heb) => (
        <Link 
          to={`/hebergement/${heb._id}`} 
          key={heb._id || heb.hash_record} 
          className="block border border-gray-100 p-4 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
        >
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-900 line-clamp-2">{heb.nom}</h3>
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">
              {heb.type}
            </span>
          </div>
          
          <div className="text-yellow-400 text-sm my-2">
            {'⭐'.repeat(heb.classification || 0) || <span className="text-gray-400">Non classé</span>}
          </div>

          {heb.distance && (
            <div className="text-emerald-600 text-sm font-medium flex items-center gap-1 mt-3">
              <span className="text-lg">📍</span> À {heb.distance} km
            </div>
          )}
        </Link>
      ))}
    </div>
  );
};