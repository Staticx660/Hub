import { useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { findPostal } from '@/lib/postalCodes';

const MAP_IMAGE = 'https://www.bragitoff.com/wp-content/uploads/2015/11/GTAV-HD-MAP-satellite.jpg';
const MAP_SIZE = 2048;
const BOUNDS = [[0, 0], [MAP_SIZE, MAP_SIZE]];

// GTA V game world bounds (standard FiveM coordinate system)
const GAME_X_MIN = -4000, GAME_X_MAX = 4500;
const GAME_Y_MIN = -4000, GAME_Y_MAX = 8000;

// Known GTA V locations with correct game coordinates [x, y]
const LOCATIONS = [
  { name: "paleto bay", x: -440, y: 6015 },
  { name: "paleto forest", x: -300, y: 5500 },
  { name: "mount chiliad", x: -450, y: 5400 },
  { name: "mount gordo", x: 500, y: 5400 },
  { name: "procopio beach", x: -100, y: 6200 },
  { name: "alamo sea", x: 1700, y: 4400 },
  { name: "sandy shores", x: 2000, y: 3700 },
  { name: "sandy shores airfield", x: 1750, y: 3500 },
  { name: "grapeseed", x: 2440, y: 4970 },
  { name: "mount josiah", x: 1500, y: 4900 },
  { name: "grand senora desert", x: 1500, y: 2500 },
  { name: "harmony", x: 500, y: 2300 },
  { name: "great chaparral", x: 1000, y: 2000 },
  { name: "redwood lights track", x: 200, y: 2500 },
  { name: "galileo observatory", x: -430, y: 750 },
  { name: "galileo park", x: -200, y: 1100 },
  { name: "zancudo river", x: -2000, y: 2700 },
  { name: "fort zancudo", x: -2300, y: 3100 },
  { name: "lago zancudo", x: -2300, y: 3300 },
  { name: "chumash", x: -3200, y: 1050 },
  { name: "banham canyon", x: -2300, y: 1500 },
  { name: "tongva valley", x: -1800, y: 2000 },
  { name: "tongva hills", x: -1600, y: 2200 },
  { name: "vinewood hills", x: 200, y: 500 },
  { name: "vinewood sign", x: 700, y: 150 },
  { name: "vinewood bowl", x: 200, y: 200 },
  { name: "vinewood", x: 300, y: 100 },
  { name: "downtown vinewood", x: 250, y: 50 },
  { name: "east vinewood", x: 900, y: -200 },
  { name: "mirror park", x: 1140, y: -660 },
  { name: "vinewood racetrack", x: 200, y: 150 },
  { name: "rockford hills", x: -300, y: -200 },
  { name: "burton", x: -150, y: -100 },
  { name: "richman", x: -1600, y: -300 },
  { name: "morningwood", x: -1400, y: -500 },
  { name: "del perro", x: -1600, y: -700 },
  { name: "del perro pier", x: -1200, y: -1500 },
  { name: "vespucci", x: -1100, y: -1200 },
  { name: "vespucci beach", x: -1230, y: -1570 },
  { name: "pleasure pier", x: -1150, y: -1650 },
  { name: "little seoul", x: -600, y: -500 },
  { name: "los santos golf club", x: -1000, y: -200 },
  { name: "pillbox hill", x: 200, y: -700 },
  { name: "mission row", x: 428, y: -984 },
  { name: "legion square", x: 300, y: -900 },
  { name: "maze bank tower", x: -100, y: -700 },
  { name: "pacific standard bank", x: 100, y: -600 },
  { name: "strawberry", x: 200, y: -1300 },
  { name: "chamberlain hills", x: 50, y: -1400 },
  { name: "davis", x: 100, y: -1500 },
  { name: "central los santos medical center", x: 300, y: -1400 },
  { name: "la mesa", x: 850, y: -1400 },
  { name: "cypress flats", x: 900, y: -200 },
  { name: "murrieta heights", x: 1100, y: -500 },
  { name: "el burro heights", x: 1380, y: -1400 },
  { name: "rancho", x: 400, y: -1700 },
  { name: "banning", x: 200, y: -1900 },
  { name: "los santos international airport", x: -1043, y: -3106 },
  { name: "elsian island", x: -1700, y: -2500 },
  { name: "terminal", x: -1200, y: -2900 },
  { name: "tataviam mountains", x: 2000, y: -200 },
  { name: "palomino highlands", x: 2500, y: -500 },
  { name: "paleto", x: -440, y: 6015 },
  { name: "sandy", x: 2000, y: 3700 },
  { name: "grape seed", x: 2440, y: 4970 },
  { name: "lsia", x: -1043, y: -3106 },
  { name: "airport", x: -1043, y: -3106 },
  { name: "hospital", x: 300, y: -1400 },
  { name: "pd", x: 428, y: -984 },
  { name: "police station", x: 428, y: -984 },
  { name: "mission row pd", x: 428, y: -984 },
];

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function findLocation(str) {
  if (!str) return null;
  // 1. Try postal code lookup
  const postalMatch = str.match(/postal\s*(\d+)/i) || str.match(/\b(\d{3})\b/);
  if (postalMatch) {
    const postal = findPostal(postalMatch[1]);
    if (postal) return { x: postal.x, y: postal.y, name: `Postal ${postalMatch[1]}` };
  }
  // 2. Try named location lookup
  const q = normalize(str);
  let best = null;
  let bestLen = 0;
  for (const loc of LOCATIONS) {
    const ln = loc.name;
    if (q === ln && ln.length > bestLen) { best = loc; bestLen = ln.length; }
  }
  if (best) return best;
  for (const loc of LOCATIONS) {
    const ln = loc.name;
    if (q.includes(ln) && ln.length > bestLen) { best = loc; bestLen = ln.length; }
  }
  if (best) return best;
  for (const loc of LOCATIONS) {
    const ln = loc.name;
    if (ln.includes(q) && q.length > 3 && q.length > bestLen) { best = loc; bestLen = q.length; }
  }
  return best;
}

// Convert GTA V game coordinates to Leaflet [lat, lng]
// FIX: Y-axis was inverted before — north (high Y) must map to lat=0 (top)
function gameToLeaflet(gx, gy) {
  const lng = ((gx - GAME_X_MIN) / (GAME_X_MAX - GAME_X_MIN)) * MAP_SIZE;
  const lat = ((GAME_Y_MAX - gy) / (GAME_Y_MAX - GAME_Y_MIN)) * MAP_SIZE;
  return [lat, lng];
}

function hashLocation(str) {
  if (!str) return [MAP_SIZE / 2, MAP_SIZE / 2];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const normX = 0.2 + (Math.abs(hash) % 1000) / 1250;
  const normY = 0.2 + (Math.abs(hash >> 8) % 1000) / 1250;
  return [normY * MAP_SIZE, normX * MAP_SIZE];
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
          </div>
        )}
      </div>
    </>
  );
}