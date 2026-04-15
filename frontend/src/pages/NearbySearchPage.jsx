import React, { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { hebergementApi } from '../api/axios';
import { calculateDistance } from '../services/distanceService';
import { MapView } from '../components/hebergement/MapView';
import { RadiusFilter } from '../components/hebergement/RadiusFilter';
import { HebergementList } from '../components/hebergement/HebergementList';

const NearbySearchPage = () => {
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const [radius, setRadius] = useState('TOUS'); 
  const [hebergements, setHebergements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDonnees = async () => {
      setLoading(true);
      try {
        if (radius === 'TOUS' || !location.lat) {
          const data = await hebergementApi.fetchMapData();
          setHebergements(data);
        } else {
          const data = await hebergementApi.fetchNearby(location.lat, location.lng, radius);
          const dataWithDistance = data.map(heb => {
            const coords = heb.localisation?.coordinates?.coordinates;
            return { 
              ...heb, 
              distance: coords ? calculateDistance(location.lat, location.lng, coords[1], coords[0]) : null 
            };
          });
          setHebergements(dataWithDistance);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!geoLoading) fetchDonnees();
  }, [location, radius, geoLoading]);

  return (
    // h-[calc(100vh-64px)] assume que ton Header fait environ 64px de haut. 
    // Cela évite que la page scrolle. Seule la liste scrollera.
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 p-4 lg:p-6">
      
      {geoError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
          <p className="text-red-700 text-sm">{geoError} (Mode Carte globale activé par défaut)</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden">
        
        {/* Colonne Liste */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col min-w-[320px]">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Carte Interactive</h1>
          <RadiusFilter value={radius} onChange={setRadius} />
          <HebergementList hebergements={hebergements} loading={loading || geoLoading} />
        </div>

        {/* Colonne Carte */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
          {geoLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500 animate-pulse">
              Recherche de votre position...
            </div>
          ) : (
            <MapView hebergements={hebergements} userLocation={location} isGlobal={radius === 'TOUS'} />
          )}
        </div>
        
      </div>
    </div>
  );
};

export default NearbySearchPage;