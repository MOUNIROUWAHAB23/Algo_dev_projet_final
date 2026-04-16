import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Link } from 'react-router-dom';
import { getTypeIcon } from '../../utils/mapIcons';
import 'leaflet/dist/leaflet.css';

// L'animation de ton collègue pour zoomer sur l'utilisateur
function FlyToUser({ userPosition, isGlobal }) {
  const map = useMap();

  useEffect(() => {
    if (userPosition && !isGlobal) {
      map.flyTo([userPosition.lat, userPosition.lng], 11, {
        animate: true,
        duration: 1.5,
      });
    } else if (isGlobal) {
      map.flyTo([46.603354, 1.888334], 6, { animate: true }); 
    }
  }, [map, userPosition, isGlobal]);

  return null;
}

export const MapView = ({ hebergements, userLocation, isGlobal }) => {
  const defaultCenter = [46.603354, 1.888334]; 
  const center = (!isGlobal && userLocation.lat) ? [userLocation.lat, userLocation.lng] : defaultCenter;
  const zoom = (!isGlobal && userLocation.lat) ? 11 : 6;

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
      <MapContainer center={center} zoom={zoom} className="h-full w-full">
        
        <TileLayer 
          attribution='&copy; OpenStreetMap' 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        
        <FlyToUser userPosition={userLocation} isGlobal={isGlobal} />

        {/* Le point bleu de l'utilisateur (Code de ton collègue) */}
        {userLocation.lat && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={10}
            pathOptions={{
              color: "#1976d2",
              fillColor: "#1976d2",
              fillOpacity: 0.4,
            }}
          >
            <Popup><strong>📍 Ma position</strong></Popup>
          </CircleMarker>
        )}

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {hebergements.map((heb) => {
            const coords = heb.localisation?.coordinates?.coordinates;
            // On vérifie que les coordonnées existent bien (notre backend donne [lng, lat])
            if (!coords || coords.length !== 2) return null;
            
            return (
              <Marker 
                key={heb._id || heb.hash_record} 
                position={[coords[1], coords[0]]} // Leaflet veut [Lat, Lng]
                icon={getTypeIcon(heb.type)} // L'ICÔNE MAGIQUE COLORÉE
              >
                <Popup>
                  <div className="text-center pb-2 min-w-[200px]">
                    <strong className="block text-gray-900 mb-1">{heb.nom}</strong>
                    <span className="text-gray-500 text-sm block">Type: {heb.type}</span>
                    <span className="text-yellow-500 block mb-2">{'⭐'.repeat(heb.classification || 0)}</span>
                    
                    <div className="text-xs text-gray-400 mb-3">
                      {heb.localisation?.commune}, {heb.localisation?.region}
                    </div>

                    {heb.distance && <div className="text-emerald-600 font-medium mb-3">📍 à {heb.distance} km</div>}
                    
                    <Link to={`/hebergement/${heb._id}`} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition w-full inline-block">
                      Voir la fiche
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};