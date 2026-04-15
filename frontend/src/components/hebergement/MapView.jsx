
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// Utilisation d'icônes distantes (Sécuritaire pour Vite et Create React App)
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Composant utilitaire pour recentrer la carte dynamiquement
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export const MapView = ({ hebergements, userLocation, isGlobal }) => {
  // Centre par défaut (France)
  const defaultCenter = [46.603354, 1.888334]; 
  const center = (!isGlobal && userLocation.lat) ? [userLocation.lat, userLocation.lng] : defaultCenter;
  const zoom = (!isGlobal && userLocation.lat) ? 11 : 6;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 1 }}>
      <MapUpdater center={center} zoom={zoom} />
      
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Position de l'utilisateur en ROUGE */}
      {userLocation.lat && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup><strong>📍 Vous êtes ici</strong></Popup>
        </Marker>
      )}

      {/* Cluster des hébergements */}
      <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
        {hebergements.map((heb) => {
          const coords = heb.localisation?.coordinates?.coordinates;
          if (!coords || coords.length !== 2) return null;
          
          return (
            <Marker key={heb._id || heb.hash_record} position={[coords[1], coords[0]]} icon={defaultIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>{heb.nom}</strong><br/>
                  <span style={{ color: '#666' }}>{heb.type}</span><br/>
                  {'⭐'.repeat(heb.classification || 0)}
                  {heb.distance && <div style={{ color: '#059669', marginTop: '5px' }}>📍 {heb.distance} km</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};