import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap, Tooltip, GeoJSON } from 'react-leaflet';
import { PostcodeZone, RentalRequest } from '../types';
import { PC4_ZONES, AMSTERDAM_CENTER, ZOOM_LEVEL, MAP_ATTRIBUTION } from '../constants';
import { getDistrictColorFromPC4, getDistrictNameFromPC4 } from '../services/geoService';
import { Calendar, Info, AlertCircle } from 'lucide-react';
import L from 'leaflet';

interface MapBoardProps {
  requests: RentalRequest[];
  onZoneSelect: (zone: PostcodeZone) => void;
}

const MapController = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
};

const MapBoard: React.FC<MapBoardProps> = ({ requests, onZoneSelect }) => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    // Attempt to fetch the official Amsterdam GeoJSON
    // User must place 'amsterdam_pc4.geojson' in the public/ folder
    fetch('./amsterdam_pc4.geojson')
      .then(response => {
        if (!response.ok) throw new Error("GeoJSON not found");
        return response.json();
      })
      .then(data => {
        setGeoJsonData(data);
        setLoadingGeo(false);
      })
      .catch(err => {
        console.warn("Could not load external GeoJSON, using fallbacks.", err);
        setGeoError(true);
        setLoadingGeo(false);
      });
  }, []);

  // Style function for GeoJSON features
  const geoJsonStyle = (feature: any) => {
    const pc4 = feature.properties.Postcode4 || feature.properties.PC4 || "0000";
    const fillColor = getDistrictColorFromPC4(String(pc4));
    
    return {
      color: '#ffffff', // White border allows users to distinguish PC4 boundaries within the same district
      weight: 1,        // Slightly thinner lines for a cleaner look
      opacity: 0.9,
      fillColor: fillColor,
      fillOpacity: 0.2, // Reduced opacity for a subtler look
    };
  };

  // Event handlers for GeoJSON features
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const pc4 = String(feature.properties.Postcode4 || feature.properties.PC4 || "0000");
    const districtName = getDistrictNameFromPC4(pc4);

    // Add tooltip
    layer.bindTooltip(
      `<div class="text-center font-sans"><strong class="block">PC ${pc4}</strong><span class="text-xs text-gray-600">${districtName}</span></div>`,
      { sticky: true, direction: 'top', className: 'custom-tooltip' }
    );

    // Click handler
    layer.on({
      click: (e: any) => {
        L.DomEvent.stopPropagation(e); // Prevent map click
        const bounds = e.target.getBounds();
        const center = bounds.getCenter();

        const zone: PostcodeZone = {
          id: pc4,
          districtName: districtName,
          color: getDistrictColorFromPC4(pc4),
          center: [center.lat, center.lng],
          polygon: [] 
        };
        
        // Reset all other layers styles (optional implementation complexity, skipping for performance)
        // Just highlight current
        e.target.setStyle({ weight: 2, color: '#333', fillOpacity: 0.4 });
        
        onZoneSelect(zone);
      },
      mouseover: (e: any) => {
        e.target.setStyle({ weight: 2, color: '#fff', fillOpacity: 0.4 });
        e.target.openTooltip();
      },
      mouseout: (e: any) => {
        // Reset to original style
        // Note: If we clicked it, we might want to keep it highlighted, but for now simple hover effect
        const color = getDistrictColorFromPC4(pc4);
        e.target.setStyle({ 
          color: '#ffffff', 
          weight: 1, 
          fillColor: color,
          fillOpacity: 0.2 
        });
        e.target.closeTooltip();
      }
    });
  };

  return (
    <div className="h-full w-full relative z-0">
      {/* Warning if using fallback data */}
      {geoError && (
        <div className="absolute top-4 left-16 right-16 z-[400] flex justify-center pointer-events-none">
           <div className="bg-yellow-50/90 backdrop-blur text-yellow-800 text-xs px-3 py-1 rounded-full shadow-sm border border-yellow-200 flex items-center gap-2 pointer-events-auto">
              <AlertCircle className="w-3 h-3" />
              <span>Demo Mode: Showing 5 sample zones. Add 'amsterdam_pc4.geojson' for full map.</span>
           </div>
        </div>
      )}

      <MapContainer 
        center={AMSTERDAM_CENTER} 
        zoom={ZOOM_LEVEL} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <MapController />
        {/* Using a lighter, simpler basemap to make the colored overlays pop more */}
        <TileLayer
          attribution={MAP_ATTRIBUTION}
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. Full GeoJSON Layer (Preferred) */}
        {!loadingGeo && geoJsonData && (
          <GeoJSON 
            key="amsterdam-layer" // Key ensures re-render if data changes
            data={geoJsonData} 
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* 2. Fallback Polygon Layer (If GeoJSON fails) */}
        {(loadingGeo || geoError) && PC4_ZONES.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.polygon}
            pathOptions={{ 
              color: 'white', 
              weight: 1.5,
              fillColor: zone.color, 
              fillOpacity: 0.2, // Consistent reduced opacity
            }}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onZoneSelect(zone);
              },
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({ fillOpacity: 0.4, weight: 2 });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({ fillOpacity: 0.2, weight: 1.5 });
              }
            }}
          >
             <Tooltip sticky direction="top">
              <div className="text-center text-xs">
                <strong>PC {zone.id}</strong><br/>
                {zone.districtName}
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* User Request Markers */}
        {requests.map((req) => {
          const zoneColor = getDistrictColorFromPC4(req.zoneId);
          
          return (
            <CircleMarker
              key={req.id}
              center={[req.lat, req.lng]}
              radius={6}
              pathOptions={{
                color: '#fff',
                weight: 2,
                fillColor: '#111827', // Dark marker for contrast against colorful map
                fillOpacity: 1
              }}
            >
              <Popup className="request-popup" closeButton={false}>
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 border-b pb-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
                      style={{backgroundColor: zoneColor}}
                    >
                      {req.zoneId}
                    </div>
                    <div>
                       <h3 className="font-bold text-gray-800 leading-tight">{req.item}</h3>
                       <span className="text-xs text-gray-500 block font-mono">{req.postcode}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <p className="italic text-xs">"{req.description}"</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(req.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-8 left-4 bg-white/95 backdrop-blur p-4 rounded-xl shadow-xl z-[500] text-xs border border-gray-200 w-[160px]">
        <h4 className="font-bold mb-3 text-gray-800 border-b pb-1">Districts (PC4)</h4>
        <div className="space-y-1.5">
          {[
             {l: 'Centrum', c: '#E4002B'},
             {l: 'West', c: '#009DE6'},
             {l: 'Zuid', c: '#007E3C'},
             {l: 'Oost', c: '#FF7F00'},
             {l: 'Noord', c: '#8F00FF'},
             {l: 'Nieuw-West', c: '#6D8B24'},
             {l: 'Zuidoost', c: '#EC008C'},
             {l: 'Westpoort', c: '#787878'},
          ].map(item => (
             <div key={item.l} className="flex items-center gap-2">
               <span className="w-3 h-3 rounded-sm shadow-sm opacity-60" style={{backgroundColor: item.c}}></span>
               <span className="text-gray-600 font-medium">{item.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapBoard;