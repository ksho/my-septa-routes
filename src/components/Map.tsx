'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Center City Philadelphia coordinates
const PHILADELPHIA_CENTER = [39.9526, -75.1652] as [number, number];

// SEPTA bus routes we want to track (subway lines not available via TransitView API)
const ROUTES = ['57', '47', '42', '9', '12', '21', '29'];

interface Vehicle {
  lat: number;
  lng: number;
  label: string;
  VehicleID: string;
  Direction: string;
  destination: string;
  late: number;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Route color mapping for better visualization
const ROUTE_COLORS: { [key: string]: string } = {
  '9': '#FF6B6B',
  '12': '#4ECDC4', 
  '21': '#45B7D1',
  '29': '#FF8C42',
  '42': '#96CEB4',
  '47': '#FFEAA7',
  '57': '#DDA0DD',
};

// Create colored markers for each route
const createRouteIcon = (route: string) => {
  const color = ROUTE_COLORS[route] || '#666666';
  
  return L.divIcon({
    html: `
      <div class="route-marker" style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: bold;
        color: white;
        text-align: center;
        line-height: 1;
      ">${route}</div>
    `,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

interface RouteGeometry {
  type: 'LineString' | 'MultiLineString';
  coordinates: [number, number][] | [number, number][][];
}

interface RouteFeature {
  type: 'Feature';
  properties: {
    LineAbbr: string;
    LineName: string;
    tpField020?: string;
    tpField021?: string;
  };
  geometry: RouteGeometry;
}

export default function Map() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [routeGeometry, setRouteGeometry] = useState<RouteFeature[]>([]);

  const fetchRouteGeometry = async () => {
    try {
      console.log('Fetching route geometry for routes:', ROUTES.join(','));
      const response = await fetch(`/api/routes?routes=${ROUTES.join(',')}`);
      
      if (!response.ok) {
        console.warn('Failed to fetch route geometry data', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('Route geometry data received:', data);
      
      if (data.features && Array.isArray(data.features)) {
        console.log('Setting route geometry, features count:', data.features.length);
        setRouteGeometry(data.features);
      } else {
        console.warn('No features found in route geometry data');
      }
    } catch (error) {
      console.error('Error fetching route geometry:', error);
    }
  };

  const fetchVehicleData = async () => {
    try {
      const allVehicles: Vehicle[] = [];
      
      // Fetch data for each route using our API proxy
      for (const route of ROUTES) {
        try {
          const response = await fetch(`/api/septa?route=${route}`);
          
          if (!response.ok) {
            console.warn(`Failed to fetch data for route ${route}: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          
          if (data.bus && Array.isArray(data.bus)) {
            const routeVehicles = data.bus.map((bus: {
              lat: string;
              lng: string;
              label?: string;
              VehicleID: string;
              Direction: string;
              destination?: string;
              late?: string;
            }) => {
              const vehicle = {
                lat: parseFloat(bus.lat),
                lng: parseFloat(bus.lng),
                label: route, // Use the route number we're fetching for
                VehicleID: bus.VehicleID,
                Direction: bus.Direction,
                destination: bus.destination || 'Unknown',
                late: parseInt(bus.late || '0') || 0,
              };
              return vehicle;
            }).filter((vehicle: Vehicle) => 
              !isNaN(vehicle.lat) && !isNaN(vehicle.lng) && 
              vehicle.lat !== 0 && vehicle.lng !== 0
            );
            allVehicles.push(...routeVehicles);
          }
        } catch (routeError) {
          console.error(`Error fetching route ${route}:`, routeError);
        }
      }
      
      setVehicles(allVehicles);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch route geometry once on component mount
    fetchRouteGeometry();
    
    // Fetch vehicle data immediately and set up interval
    fetchVehicleData();
    const interval = setInterval(fetchVehicleData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={PHILADELPHIA_CENTER}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={20}
        />
        
        {/* Official SEPTA route paths */}
        {showPaths && routeGeometry.map((feature, index) => {
          const route = feature.properties.LineAbbr;
          console.log('Processing route:', route, 'geometry type:', feature.geometry.type);
          
          // Handle both LineString and MultiLineString geometries
          let coordinateSets: [number, number][][] = [];
          
          if (feature.geometry.type === 'LineString') {
            const coords = feature.geometry.coordinates as [number, number][];
            coordinateSets = [coords.map(coord => 
              [coord[1], coord[0]] as [number, number]
            )];
          } else if (feature.geometry.type === 'MultiLineString') {
            const coords = feature.geometry.coordinates as [number, number][][];
            coordinateSets = coords.map(lineString =>
              lineString.map(coord => [coord[1], coord[0]] as [number, number])
            );
          }
          
          console.log('Route', route, 'has', coordinateSets.length, 'line segments');
          
          return coordinateSets.map((coordinates, segmentIndex) => (
            <Polyline
              key={`route-${route}-${index}-${segmentIndex}`}
              positions={coordinates}
              pathOptions={{
                color: ROUTE_COLORS[route] || '#666666',
                weight: 4,
                opacity: 0.7,
              }}
            />
          ));
        }).flat()}
        
        {vehicles.map((vehicle, index) => (
          <Marker
            key={`${vehicle.VehicleID}-${index}`}
            position={[vehicle.lat, vehicle.lng]}
            icon={createRouteIcon(vehicle.label)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg mb-2" style={{color: ROUTE_COLORS[vehicle.label] || '#666'}}>
                  Route {vehicle.label}
                </h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Vehicle:</span> {vehicle.VehicleID}</p>
                  <p><span className="font-semibold">Direction:</span> {vehicle.Direction}</p>
                  <p><span className="font-semibold">Destination:</span> {vehicle.destination}</p>
                  {vehicle.late > 0 && (
                    <p className="text-red-600 font-semibold">⚠️ Late: {vehicle.late} min</p>
                  )}
                  {vehicle.late === 0 && (
                    <p className="text-green-600 font-semibold">✅ On time</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {loading && (
        <div className="absolute top-20 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>Loading vehicle data...</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm">Vehicle Count: {vehicles.length}</h3>
          <button
            onClick={() => setShowPaths(!showPaths)}
            className={`px-2 py-1 text-xs rounded ${
              showPaths 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
{showPaths ? 'Hide Routes' : 'Show Routes'}
          </button>
        </div>
        <div className="text-xs space-y-1">
          {ROUTES.map(route => {
            const count = vehicles.filter(v => v.label === route).length;
            return (
              <div key={route} className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{backgroundColor: ROUTE_COLORS[route]}}
                  ></div>
                  <span>Route {route}</span>
                </div>
                <span className="font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}