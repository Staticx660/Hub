import { useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAP_IMAGE = 'https://www.bragitoff.com/wp-content/uploads/2015/11/GTAV-HD-MAP-satellite.jpg';
const MAP_SIZE = 2048;
const BOUNDS = [[0, 0], [MAP_SIZE, MAP_SIZE]];

// GTA V game world bounds (standard FiveM coordinates)
// X: -4000 (west) to 4500 (east)
// Y: -4000 (south) to 8000 (north)
const GAME_X_MIN = -4000, GAME_X_MAX = 4500;
const GAME_Y_MIN = -4000, GAME_Y_MAX = 8000;

// GTA V locations with actual in-game coordinates [x, y] where x=east, y=north
const LOCATIONS = [
  // North / Blaine County
  { name: "Paleto Bay", x: -440, y: 6015 },
  { name: "Paleto Forest", x: -300, y: 5500 },
  { name: "Mount Chiliad", x: -450, y: 5400 },
  { name: "Mount Gordo", x: 500, y: 5400 },
  { name: "Procopio Beach", x: -100, y: 6200 },
  { name: "El Gordo Lighthouse", x: 300, y: 5600 },
  // Alamo Sea area
  { name: "Alamo Sea", x: 1700, y: 4400 },
  { name: "Sandy Shores", x: 2000, y: 3700 },
  { name: "Sandy Shores Airfield", x: 1750, y: 3500 },
  { name: "Grapeseed", x: 2440, y: 4970 },
  { name: "Mount Josiah", x: 1500, y: 4900 },
  // Central desert
  { name: "Grand Senora Desert", x: 1500, y: 2500 },
  { name: "Harmony", x: 500, y: 2300 },
  { name: "Great Chaparral", x: 1000, y: 2000 },
  { name: "Redwood Lights Track", x: 200, y: 2500 },
  { name: "Galileo Observatory", x: -430, y: 750 },
  { name: "Galileo Park", x: -200, y: 1100 },
  // Fort Zancudo area
  { name: "Zancudo River", x: -2000, y: 2700 },
  { name: "Fort Zancudo", x: -2300, y: 3100 },
  { name: "Lago Zancudo", x: -2300, y: 3300 },
  // West coast
  { name: "Chumash", x: -3200, y: 1050 },
  { name: "Banham Canyon", x: -2300, y: 1500 },
  { name: "Tongva Valley", x: -1800, y: 2000 },
  { name: "Tongva Hills", x: -1600, y: 2200 },
  // Vinewood area
  { name: "Vinewood Hills", x: 200, y: 500 },
  { name: "Vinewood Sign", x: 700, y: 150 },
  { name: "Vinewood Bowl", x: 200, y: 200 },
  { name: "Vinewood", x: 300, y: 100 },
  { name: "Downtown Vinewood", x: 250, y: 50 },
  { name: "East Vinewood", x: 900, y: -200 },
  { name: "Mirror Park", x: 1140, y: -660 },
  { name: "Vinewood Racetrack", x: 200, y: 150 },
  // Los Santos central
  { name: "Rockford Hills", x: -300, y: -200 },
  { name: "Burton", x: -150, y: -100 },
  { name: "Richman", x: -1600, y: -300 },
  { name: "Morningwood", x: -1400, y: -500 },
  { name: "Del Perro", x: -1600, y: -700 },
  { name: "Del Perro Pier", x: -1200, y: -1500 },
  { name: "Vespucci", x: -1100, y: -1200 },
  { name: "Vespucci Beach", x: -1230, y: -1570 },
  { name: "Pleasure Pier", x: -1150, y: -1650 },
  { name: "Little Seoul", x: -600, y: -500 },
  { name: "Los Santos Golf Club", x: -1000, y: -200 },
  // Downtown
  { name: "Pillbox Hill", x: 200, y: -700 },
  { name: "Mission Row", x: 428, y: -984 },
  { name: "Legion Square", x: 300, y: -900 },
  { name: "Maze Bank Tower", x: -100, y: -700 },
  { name: "Pacific Standard Bank", x: 100, y: -600 },
  // South central
  { name: "Strawberry", x: 200, y: -1300 },
  { name: "Chamberlain Hills", x: 50, y: -1400 },
  { name: "Davis", x: 100, y: -1500 },
  { name: "Central Los Santos Medical Center", x: 300, y: -1400 },
  // East LS
  { name: "La Mesa", x: 850, y: -1400 },
  { name: "Cypress Flats", x: 900, y: -200 },
  { name: "Murrieta Heights", x: 1100, y: -500 },
  { name: "El Burro Heights", x: 1380, y: -1400 },
  { name: "Rancho", x: 400, y: -1700 },
  { name: "Banning", x: 200, y: -1900 },
  // Port / Airport
  { name: "Los Santos International Airport", x: -1043, y: -3106 },
  { name: "Elysian Island", x: -1700, y: -2500 },
  { name: "Terminal", x: -1200, y: -2900 },
  // East mountains
  { name: "Tataviam Mountains", x: 2000, y: -200 },
  { name: "Palomino Highlands", x: 2500, y: -500 },
];

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function findLocation(str) {
  if (!str) return null;
  const q = normalize(str);
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

// Convert GTA V game coordinates to Leaflet [lat, lng] for a square image
function gameToLeaflet(gx, gy) {
  const normX = (gx - GAME_X_MIN) / (GAME_X_MAX - GAME_X_MIN);
  const normY = (GAME_Y_MAX - gy) / (GAME_Y_MAX - GAME_Y_MIN);
  const lng = normX * MAP_SIZE;
  const lat = (1 - normY) * MAP_SIZE;
  return [lat, lng];
}

function hashLocation(str) {
  if (!str) return [MAP_SIZE / 2, MAP_SIZE / 2];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const normX = 0.2 + (Math.abs(hash) % 1000) / 1250;
  const normY = 0.2 + (Math.abs(hash >> 8) % 1000) / 1250;
  const lng = normX * MAP_SIZE;
  const lat = (1 - normY) * MAP_SIZE;
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
  const pos = matched ? gameToLeaflet(matched.x, matched.y) : hashLocation(location);

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