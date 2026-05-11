'use client';
import { useEffect, useRef } from 'react';

interface Props { lat: number; lng: number; }

const DAE = [
  { lat: 42.6612 + 0.0007, lng: 13.6985 + 0.0010, name: 'Farmacia Centrale', status: 'active' },
  { lat: 42.6612 - 0.0005, lng: 13.6985 - 0.0008, name: 'Palestra Comunale',  status: 'in_use' },
  { lat: 42.6612 + 0.0015, lng: 13.6985 - 0.0005, name: 'Stazione FS',        status: 'active' },
  { lat: 42.6612 - 0.0018, lng: 13.6985 + 0.0015, name: 'Centro Comm.',       status: 'maintenance' },
];

const COLOR: Record<string, string> = {
  active: '#22c97a', in_use: '#f5a623', maintenance: '#e63535',
};

export default function Mappa({ lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const userCircle = useRef<any>(null);

  // Crea la mappa una sola volta
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return;
      const L = (window as any).L;
      if (!L) return;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
      });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Marker utente
      const userIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b9eff;border:3px solid white;box-shadow:0 0 8px rgba(59,158,255,0.6)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: '',
      });
      userMarker.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>La tua posizione</b>');

      // Cerchio 500m
      userCircle.current = L.circle([lat, lng], {
        radius: 500,
        color: '#3b9eff',
        fillColor: '#3b9eff',
        fillOpacity: 0.05,
        weight: 1,
      }).addTo(map);

      // Marker DAE (fissi)
      DAE.forEach(d => {
        const color = COLOR[d.status];
        const icon = L.divIcon({
          html: `<div style="width:30px;height:30px;border-radius:50%;background:${color}33;border:2px solid ${color};display:flex;align-items:center;justify-content:center;color:${color};font-size:18px;font-weight:900;line-height:1">+</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          className: '',
        });
        L.marker([d.lat, d.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${d.name}</b><br>Stato: ${d.status}`);
      });
    };

    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        userMarker.current = null;
        userCircle.current = null;
      }
    };
  }, []); // <-- Dipendenze vuote = mappa creata una sola volta

  // Aggiorna solo la posizione del marker quando lat/lng cambiano
  useEffect(() => {
    if (userMarker.current && userCircle.current) {
      const L = (window as any).L;
      if (!L) return;
      const newPos = L.latLng(lat, lng);
      userMarker.current.setLatLng(newPos);
      userCircle.current.setLatLng(newPos);
    }
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: 320,
        borderRadius: 10,
        border: '1px solid #252b36',
        touchAction: 'pan-x pan-y', // Abilita touch gestures
      }}
    />
  );
}