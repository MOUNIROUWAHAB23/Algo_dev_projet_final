import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getTypeIcon } from "../../utils/mapIcons";

const FRANCE_CENTER = [46.603354, 1.888334];
const FRANCE_ZOOM = 6;

function FlyToUser({ userPosition }) {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.flyTo(userPosition, 12, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [map, userPosition]);

  return null;
}

function MarkerPopupContent({ item }) {
  return (
    <div style={{ minWidth: "220px" }}>
      <strong>{item.nom}</strong>
      <div style={{ marginTop: "8px" }}>Type: {item.type}</div>
      <div>Classification: {item.classification ?? "N/A"}</div>
      <div>
        {item.commune}, {item.region}
      </div>
    </div>
  );
}

export default function MapView({ markers, userPosition }) {
  return (
    <div
      style={{
        height: "min(70vh, 650px)",
        width: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <MapContainer
        center={FRANCE_CENTER}
        zoom={FRANCE_ZOOM}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToUser userPosition={userPosition} />

        <MarkerClusterGroup chunkedLoading>
          {markers.map((item) => {
            const [lng, lat] = item.coordinates || [];
            if (typeof lat !== "number" || typeof lng !== "number") return null;

            return (
              <Marker
                key={item.id}
                position={[lat, lng]}
                icon={getTypeIcon(item.type)}
              >
                <Popup>
                  <MarkerPopupContent item={item} />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {userPosition && (
          <CircleMarker
            center={userPosition}
            radius={10}
            pathOptions={{
              color: "#1976d2",
              fillColor: "#1976d2",
              fillOpacity: 0.35,
            }}
          >
            <Popup>Ma position</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}