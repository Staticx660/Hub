import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAP_IMAGE = 'https://docs.ricearaul.com/gta-v-map/atlas.png';
const BOUNDS = [[0, 0], [2048, 2048]];

function hashLocation(str) {
  if (!str) return [1024, 1024];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const x = 200 + (Math.abs(hash) % 1648);
  const y = 200 + (Math.abs(hash >> 8) % 1648);
  return [y, x];
}

const pinIcon = L.divIcon({
  className: 'gta5-pin',
  html: '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.9));">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function GTA5Map({ location, height = 280 }) {
  const pos = hashLocation(location);
  return (
    <>
      <style>{`.gta5-map-container{position:relative;z-index:0}.gta5-map-container .leaflet-pane{z-index:1}.gta5-map-container .leaflet-top,.gta5-map-container .leaflet-bottom,.gta5-map-container .leaflet-control{z-index:2}`}</style>
      <div className="gta5-map-container rounded-lg overflow-hidden border border-slate-700 bg-slate-950" style={{ height }}>
        <MapContainer crs={L.CRS.Simple} bounds={BOUNDS} center={pos} zoom={0} minZoom={-2} maxZoom={3} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <ImageOverlay url={MAP_IMAGE} bounds={BOUNDS} />
          <ZoomControl position="bottomright" />
          <Marker position={pos} icon={pinIcon}>
            <Popup>{location || 'Unknown Location'}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </>
  );
}