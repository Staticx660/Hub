import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'location-pin',
  html: '<div style="font-size:28px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9));">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function LocationMap({ location, height = 280 }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) { setCoords(null); return; }
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => { setCoords(data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null); })
      .catch(() => setCoords(null))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [location]);

  return (
    <>
      <style>{`.location-map-container .leaflet-pane{z-index:1}.location-map-container .leaflet-top,.location-map-container .leaflet-bottom,.location-map-container .leaflet-control{z-index:2}.leaflet-container{background:#0f172a;font-family:inherit}`}</style>
      <div className="location-map-container rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative" style={{ height }}>
        {location && (
          <div className="absolute top-2 left-2 z-[1000] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {location}
          </div>
        )}
        {!location ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <MapPin className="w-8 h-8 opacity-30" />
            <p className="text-xs">No location set</p>
          </div>
        ) : coords ? (
          <MapContainer center={coords} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ZoomControl position="bottomright" />
            <Marker position={coords} icon={pinIcon}>
              <Popup>{location}</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            {loading ? <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /> : <MapPin className="w-8 h-8 opacity-30" />}
            <p className="text-xs">{loading ? "Locating..." : location}</p>
            {!loading && <p className="text-xs text-slate-700">Address not found on map</p>}
          </div>
        )}
      </div>
    </>
  );
}