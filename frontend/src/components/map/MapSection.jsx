import { useEffect, useMemo, useState } from "react";
import { useMapHebergements } from "../../hooks/useMapHebergements";
import MapView from "./MapView";
import { TYPE_COLORS } from "../../utils/mapIcons";

const LEGEND_ITEMS = [
  { label: "Hotel", color: TYPE_COLORS.HOTEL },
  { label: "Camping", color: TYPE_COLORS.CAMPING },
  { label: "Résidence", color: TYPE_COLORS.RESIDENCE },
  { label: "Auberge", color: TYPE_COLORS.AUBERGE },
  { label: "Village", color: TYPE_COLORS.VILLAGE },
];

export default function MapSection({ filters }) {
  const { markers, loading, error, fetchMarkers } = useMapHebergements();
  const [userPosition, setUserPosition] = useState(null);
  const [geoError, setGeoError] = useState("");

  const mapFilters = useMemo(
    () => ({
      q: filters.q,
      type: filters.type,
      region: filters.region,
      classification: filters.classification,
    }),
    [filters.q, filters.type, filters.region, filters.classification]
  );

  useEffect(() => {
    fetchMarkers(mapFilters);
  }, [fetchMarkers, mapFilters]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n’est pas supportée par ce navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setGeoError("");
      },
      () => {
        setGeoError("Permission refusée ou position indisponible.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return (
    <section style={{ margin: "24px 0" }}>
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Carte des hébergements</h2>
          <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
            {loading ? "Chargement de la carte..." : `${markers.length} points affichés`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLocate}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          Ma position
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "12px",
          fontSize: "14px",
        }}
      >
        {LEGEND_ITEMS.map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: item.color,
                display: "inline-block",
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: "#b91c1c", marginBottom: "12px" }}>{error}</p>
      )}

      {geoError && (
        <p style={{ color: "#b45309", marginBottom: "12px" }}>{geoError}</p>
      )}

      <MapView markers={markers} userPosition={userPosition} />
    </section>
  );
}