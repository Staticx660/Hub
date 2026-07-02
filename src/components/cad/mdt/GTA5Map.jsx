import { useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAP_IMAGE = 'https://docs.ricearaul.com/gta-v-map/atlas.png';
const BOUNDS = [[0, 0], [2048, 2048]];

function hashLocation(str) {
  if (!str) return [1024, 1024];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const x = 150 + (Math.abs(hash) % 1748);
  const y = 150 + (Math.abs(hash >> 8) % 1748);
  return [y, x];
}

const pinIcon = L.divIcon({
  className: 'gta5-pin',
  html: '<div style="position:relative;"><div style="font-size:32px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9));">📍</div><div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:12px;height:12px;background:#ef4444;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(239,68,68,0.3);animation:gta5pulse 1.5s infinite;"></div></div><style>@keyframes gta5pulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}100%{box-shadow:0 0 0 16px rgba(239,68,68,0)}}</style>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function GTA5Map({ location, height = 320 }) {
  const [imageError, setImageError] = useState(false);
  const pos = hashLocation(location);

  return (
    <>
      <style>{`.gta5-map-container{position:relative;z-index:0}.gta5-map-container .leaflet-pane{z-index:1}.gta5-map-container .leaflet-top,.gta5-map-container .leaflet-bottom,.gta5-map-container .leaflet-control{z-index:2}.leaflet-container{background:#0f172a;font-family:inherit}`}</style>
      <div className="gta5-map-container rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative" style={{ height }}>
        {location && (
          <div className="absolute top-2 left-2 z-[1000] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {location}
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
            <p className="text-xs text-slate-700">Map image unavailable</p>
          </div>
        )}
      </div>
    </>
  );
}