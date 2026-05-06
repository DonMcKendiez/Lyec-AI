import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Use CDN for default icons to avoid module issues
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPoint {
  id: string;
  name: string;
  coords: [number, number];
  description: string;
}

const ACHOLI_LOCATIONS: LocationPoint[] = [
  { id: 'gulu', name: 'Gulu', coords: [2.7746, 32.299], description: 'The commercial and cultural heart of Acholiland.' },
  { id: 'kitgum', name: 'Kitgum', coords: [3.2783, 32.8867], description: 'A key cultural hub in the northern part of Acholi territory.' },
  { id: 'pader', name: 'Pader', coords: [2.858, 33.0886], description: 'Historic region known for its strong traditional roots.' },
  { id: 'agago', name: 'Agago', coords: [2.9861, 33.3283], description: 'Known for its unique landscapes and resilient communities.' },
];

export default function CultureMap() {
  const center: [number, number] = [2.9, 32.6]; // Rough center of Acholiland

  return (
    <div className="w-full h-80 md:h-[400px] rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative">
      <MapContainer 
        center={center} 
        zoom={8} 
        scrollWheelZoom={false} 
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Shaded area for traditional Acholi districts approx region */}
        <Circle 
          center={center} 
          pathOptions={{ 
            fillColor: '#F27D26', 
            fillOpacity: 0.15, 
            color: '#F27D26', 
            weight: 2,
            dashArray: '5, 10' 
          }} 
          radius={80000} 
        />

        {ACHOLI_LOCATIONS.map((loc) => (
          <Marker key={loc.id} position={loc.coords}>
            <Popup>
              <div className="p-1">
                <h3 className="font-black text-brand-primary uppercase text-xs mb-1">{loc.name}</h3>
                <p className="text-[10px] font-medium leading-tight text-stone-600">{loc.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-brand-primary/20 shadow-sm">
        <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary">Traditional Acholiland Territory</p>
      </div>
    </div>
  );
}
