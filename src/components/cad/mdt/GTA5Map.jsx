import { useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAP_IMAGE = 'https://www.bragitoff.com/wp-content/uploads/2015/11/GTAV-HD-MAP-satellite.jpg';
const MAP_SIZE = 2048;
const BOUNDS = [[0, 0], [MAP_SIZE, MAP_SIZE]];

// Normalized GTA V locations (nx, ny) where (0,0) = top-left, (1,1) = bottom-right
// Based on the standard GTA V satellite map layout
const LOCATIONS = [
  // North / Blaine County
  { name: "Paleto Bay", x: 0.12, y: 0.08 },
  { name: "Paleto Forest", x: 0.15, y: 0.15 },
  { name: "Procopio Beach", x: 0.35, y: 0.06 },
  { name: "El Gordo Lighthouse", x: 0.38, y: 0.10 },
  { name: "Mount Chiliad", x: 0.22, y: 0.22 },
  { name: "Mount Gordo", x: 0.36, y: 0.12 },
  { name: "Mount Josiah", x: 0.52, y: 0.42 },
  // Alamo Sea area
  { name: "Alamo Sea", x: 0.48, y: 0.35 },
  { name: "Sandy Shores", x: 0.50, y: 0.32 },
  { name: "Sandy Shores Airfield", x: 0.46, y: 0.36 },
  { name: "Grapeseed", x: 0.58, y: 0.38 },
  // Central desert / Senora
  { name: "Grand Senora Desert", x: 0.48, y: 0.50 },
  { name: "Harmony", x: 0.42, y: 0.52 },
  { name: "Redwood Lights Track", x: 0.40, y: 0.55 },
  { name: "Great Chaparral", x: 0.46, y: 0.55 },
  { name: "Galileo Observatory", x: 0.60, y: 0.48 },
  { name: "Galileo Park", x: 0.63, y: 0.42 },
  // Fort Zancudo area
  { name: "Zancudo River", x: 0.30, y: 0.48 },
  { name: "Fort Zancudo", x: 0.25, y: 0.52 },
  { name: "Lago Zancudo", x: 0.23, y: 0.50 },
  // West coast
  { name: "Chumash", x: 0.18, y: 0.55 },
  { name: "Banham Canyon", x: 0.32, y: 0.75 },
  { name: "Tongva Valley", x: 0.38, y: 0.68 },
  { name: "Tongva Hills", x: 0.40, y: 0.62 },
  // Vinewood area
  { name: "Vinewood Hills", x: 0.66, y: 0.58 },
  { name: "Vinewood Sign", x: 0.68, y: 0.56 },
  { name: "Vinewood Bowl", x: 0.70, y: 0.54 },
  { name: "Vinewood", x: 0.70, y: 0.62 },
  { name: "Downtown Vinewood", x: 0.70, y: 0.62 },
  { name: "East Vinewood", x: 0.76, y: 0.58 },
  { name: "Mirror Park", x: 0.73, y: 0.55 },
  { name: "Vinewood Racetrack", x: 0.70, y: 0.56 },
  // Los Santos central
  { name: "Rockford Hills", x: 0.63, y: 0.60 },
  { name: "Burton", x: 0.65, y: 0.56 },
  { name: "Richman", x: 0.60, y: 0.58 },
  { name: "Morningwood", x: 0.55, y: 0.62 },
  { name: "Del Perro", x: 0.56, y: 0.65 },
  { name: "Del Perro Pier", x: 0.54, y: 0.65 },
  { name: "Vespucci", x: 0.50, y: 0.70 },
  { name: "Vespucci Beach", x: 0.52, y: 0.75 },
  { name: "Pleasure Pier", x: 0.55, y: 0.72 },
  { name: "Little Seoul", x: 0.60, y: 0.65 },
  { name: "Los Santos Golf Club", x: 0.58, y: 0.60 },
  // Downtown
  { name: "Pillbox Hill", x: 0.66, y: 0.66 },
  { name: "Mission Row", x: 0.68, y: 0.68 },
  { name: "Legion Square", x: 0.70, y: 0.68 },
  { name: "Maze Bank Tower", x: 0.66, y: 0.66 },
  { name: "Pacific Standard Bank", x: 0.68, y: 0.64 },
  // South central
  { name: "Strawberry", x: 0.66, y: 0.70 },
  { name: "Chamberlain Hills", x: 0.64, y: 0.72 },
  { name: "Davis", x: 0.68, y: 0.70 },
  { name: "Central Los Santos Medical Center", x: 0.66, y: 0.72 },
  { name: "Los Santos County Hospital", x: 0.66, y: 0.66 },
  // East LS
  { name: "La Mesa", x: 0.73, y: 0.65 },
  { name: "Cypress Flats", x: 0.74, y: 0.62 },
  { name: "Murrieta Heights", x: 0.76, y: 0.58 },
  { name: "El Burro Heights", x: 0.80, y: 0.65 },
  { name: "Rancho", x: 0.76, y: 0.72 },
  { name: "Banning", x: 0.72, y: 0.75 },
  // Port / Airport
  { name: "Los Santos International Airport", x: 0.58, y: 0.82 },
  { name: "Elysian Island", x: 0.53, y: 0.78 },
  { name: "Terminal", x: 0.56, y: 0.80 },
  // East mountains
  { name: "Tataviam Mountains", x: 0.82, y: 0.50 },
  { name: "Palomino Highlands", x: 0.88, y: 0.62 },
];

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function findLocation(str) {
  if (!str) return null;
  const q = normalize(str);
  // Try exact match first, then partial contains
  let best = null;
  let bestLen = 0;
  for (const loc of LOCATIONS) {
    const ln = normalize(loc.name);
    if (q === ln && ln.length > bestLen) { best = loc; bestLen = ln.length; }
  }
  if (best) return best;
  for (const loc of LOCATIONS) {
    const ln = normalize(loc.name);
    if (q.includes(ln) && ln.length > bestLen) { best = loc; bestLen = ln.length; }
  }
  if (best) return best;
  for (const loc of LOCATIONS) {
    const ln = normalize(loc.name);
    if (ln.includes(q) && q.length > 3 && q.length > bestLen) { best = loc; bestLen = q.length; }
  }
  return best;
}

function hashLocation(str) {
  if (!str) return [MAP_SIZE / 2, MAP_SIZE / 2];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const x = 150 + (Math.abs(hash) % (MAP_SIZE - 300));
  const y = 150 + (Math.abs(hash >> 8) % (MAP_SIZE - 300));
  return [y, x]; // [lat, lng]
}

function toLeafletCoord(loc) {
  // Convert normalized (nx=top-left x, ny=top-left y) to Leaflet [lat, lng]
  const lng = loc.x * MAP_SIZE;
  const lat = (1 - loc.y) * MAP_SIZE;
  return [lat, lng];
}

const pinIcon = L.divIcon({
  className: 'gta5-pin',
  html: '<div style="position:relative;"><div style="font-size:32px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9));">📍</div><div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:12px;height:12px;background:#ef4444;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(239,68,68,0.3);animation:gta5pulse 1.5s infinite;"></div></div><style>@keyframes gta5pulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}100%{box-shadow:0 0 0 16px rgba(239,68,68,0)}}</style>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function GTA5Map({ location, height = 320 }) {
  const [imageError, setImageError] = useState(false);
  const matched = findLocation(location);
  const pos = matched ? toLeafletCoord(matched) : hashLocation(location);

  return (
    <>
      <style>{`.gta5-map-container{position:relative;z-index:0}.gta5-map-container .leaflet-pane{z-index:1}.gta5-map-container .leaflet-top,.gta5-map-container .leaflet-bottom,.gta5-map-container .leaflet-control{z-index:2}.leaflet-container{background:#0f172a;font-family:inherit}`}</style>
      <div className="gta5-map-container rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative" style={{ height }}>
        {location && (
          <div className="absolute top-2 left-2 z-[1000] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {location}
            {matched && <span className="text-green-400 ml-1">● {matched.name}</span>}
          </div>
        )}
        {!imageError ? (
          <MapContainer crs={L.CRS.Simple} bounds={BOUNDS} center={pos} zoom={0} minZoom={-2} maxZoom={3} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
            <ImageOverlay url={MAP_IMAGE} bounds={BOUNDS} eventHandlers={{ error: () => setImageError(true) }} />
            <ZoomControl position="bottomright" />
            <Marker position={pos} icon={pinIcon}>
              <Popup>{location || 'Unknown Location'}</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <p className="text-sm font-medium">🗺️ GTA V Map</p>
            <p className="text-xs">{location || 'Unknown Location'}</p>
            {matched && <p className="text-xs text-green-500">Matched: {matched.name}</p>}
            <p className="text-xs text-slate-700">Map image unavailable</p>
          </div>
        )}
      </div>
    </>
  );
}