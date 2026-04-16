import L from "leaflet";

export const TYPE_COLORS = {
  HOTEL: "#d32f2f",
  CAMPING: "#2e7d32",
  RESIDENCE: "#1565c0",
  AUBERGE: "#ef6c00",
  VILLAGE: "#6a1b9a",
  DEFAULT: "#455a64",
};

const iconCache = new Map();

function svgPin(color) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
      <path fill="${color}" stroke="#ffffff" stroke-width="2"
        d="M15 1C7.8 1 2 6.8 2 14c0 10.5 13 27 13 27s13-16.5 13-27C28 6.8 22.2 1 15 1z"/>
      <circle cx="15" cy="14" r="5" fill="#ffffff"/>
    </svg>
  `;
}

export function getTypeIcon(type) {
  const key = type || "DEFAULT";
  // Pattern Singleton : on ne crée l'icône qu'une seule fois par couleur pour économiser la RAM
  if (iconCache.has(key)) return iconCache.get(key);

  const color = TYPE_COLORS[key] || TYPE_COLORS.DEFAULT;

  const icon = L.divIcon({
    html: svgPin(color),
    className: "bg-transparent border-none", // Indispensable pour enlever le fond par défaut
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -36],
  });

  iconCache.set(key, icon);
  return icon;
}