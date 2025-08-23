'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Center City Philadelphia coordinates
const PHILADELPHIA_CENTER = [39.9526, -75.1652] as [number, number];

// Default SEPTA bus routes (used when no routes in URL)
const DEFAULT_ROUTES = ['57', '47', '42', '9', '12', '21', '29'];

interface Vehicle {
  lat: number;
  lng: number;
  label: string;
  VehicleID: string;
  Direction: string;
  destination: string;
  late: number;
}

interface Route {
  number: string;
  name: string;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Extended route color mapping for better visualization
const ROUTE_COLORS: { [key: string]: string } = {
  '2': '#FF5722', '3': '#E91E63', '4': '#9C27B0', '5': '#673AB7',
  '6': '#3F51B5', '7': '#2196F3', '9': '#FF6B6B', '12': '#4ECDC4',
  '14': '#009688', '16': '#4CAF50', '17': '#8BC34A', '18': '#CDDC39',
  '20': '#FFEB3B', '21': '#45B7D1', '22': '#FF9800', '23': '#FF5722',
  '24': '#795548', '25': '#607D8B', '26': '#F44336', '27': '#E91E63',
  '28': '#9C27B0', '29': '#FF8C42', '32': '#3F51B5', '33': '#2196F3',
  '37': '#00BCD4', '38': '#009688', '39': '#4CAF50', '40': '#8BC34A',
  '41': '#CDDC39', '42': '#96CEB4', '43': '#FF9800', '44': '#FF5722',
  '45': '#795548', '46': '#607D8B', '47': '#FFEAA7', '48': '#E91E63',
  '49': '#9C27B0', '51': '#673AB7', '52': '#3F51B5', '53': '#2196F3',
  '54': '#00BCD4', '55': '#009688', '56': '#4CAF50', '57': '#DDA0DD',
  '58': '#CDDC39', '59': '#FFEB3B', '60': '#FF9800', '61': '#FF5722',
  '63': '#607D8B', '64': '#F44336', '65': '#E91E63', '66': '#9C27B0',
  '67': '#673AB7', '68': '#3F51B5', '70': '#2196F3', '71': '#00BCD4',
  '75': '#009688', '77': '#4CAF50', '79': '#8BC34A', '81': '#CDDC39',
  '82': '#FFEB3B', '84': '#FF9800', '93': '#FF5722', '94': '#795548',
  '96': '#607D8B', '97': '#F44336', '98': '#E91E63', '99': '#9C27B0',
  'K': '#FF6B35',
};

// Generate a color for routes not in the predefined list
const generateRouteColor = (route: string): string => {
  if (ROUTE_COLORS[route]) return ROUTE_COLORS[route];
  
  // Generate a consistent color based on the route string
  let hash = 0;
  for (let i = 0; i < route.length; i++) {
    hash = route.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Create colored markers for each route
const createRouteIcon = (route: string) => {
  const color = generateRouteColor(route);
  
  return L.divIcon({
    html: `
      <div class="route-marker" style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.8);
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        opacity: 0.85;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, systemTheme } = useTheme();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeGeometry, setRouteGeometry] = useState<RouteFeature[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Determine if we should use dark theme
  const isDark = mounted ? (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) : false;
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get routes from URL or use defaults
  const getRoutesFromURL = useCallback(() => {
    const routesParam = searchParams.get('routes');
    if (routesParam) {
      return routesParam.split(',').map(r => r.trim()).filter(r => r);
    }
    return DEFAULT_ROUTES;
  }, [searchParams]);
  
  // Update URL when routes change
  const updateURL = useCallback((routes: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (routes.length > 0) {
      params.set('routes', routes.join(','));
    } else {
      params.delete('routes');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
  
  // Add a route
  const addRoute = useCallback((routeNumber: string) => {
    if (selectedRoutes.length >= 10) {
      alert('Maximum of 10 routes allowed');
      return;
    }
    if (!selectedRoutes.includes(routeNumber)) {
      const newRoutes = [...selectedRoutes, routeNumber];
      setSelectedRoutes(newRoutes);
      updateURL(newRoutes);
    }
    setSearchQuery('');
  }, [selectedRoutes, updateURL]);
  
  // Remove a route
  const removeRoute = useCallback((routeNumber: string) => {
    const newRoutes = selectedRoutes.filter(r => r !== routeNumber);
    setSelectedRoutes(newRoutes);
    updateURL(newRoutes);
  }, [selectedRoutes, updateURL]);
  
  // Fetch available routes for search
  const fetchAvailableRoutes = async () => {
    try {
      const response = await fetch('/api/all-routes');
      if (response.ok) {
        const data = await response.json();
        setAvailableRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching available routes:', error);
    }
  };
  
  // Filter routes based on search query
  const filteredRoutes = availableRoutes.filter(route => 
    !selectedRoutes.includes(route.number) &&
    (route.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
     route.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 10); // Limit search results

  const fetchRouteGeometry = async () => {
    if (selectedRoutes.length === 0) return;
    
    try {
      console.log('Fetching route geometry for routes:', selectedRoutes.join(','));
      const response = await fetch(`/api/routes?routes=${selectedRoutes.join(',')}`);
      
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
    if (selectedRoutes.length === 0) {
      setVehicles([]);
      setLoading(false);
      return;
    }
    
    try {
      const allVehicles: Vehicle[] = [];
      
      // Fetch data for each route using our API proxy
      for (const route of selectedRoutes) {
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

  // Initialize routes from URL on component mount
  useEffect(() => {
    const routes = getRoutesFromURL();
    setSelectedRoutes(routes);
    fetchAvailableRoutes();
  }, [getRoutesFromURL]);
  
  // Fetch data when selected routes change
  useEffect(() => {
    fetchRouteGeometry();
    fetchVehicleData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoutes]);
  
  // Set up vehicle data polling
  useEffect(() => {
    if (selectedRoutes.length === 0) return;
    
    const interval = setInterval(fetchVehicleData, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoutes]);

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={PHILADELPHIA_CENTER}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url={isDark 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />
        
        {/* Official SEPTA route paths */}
        {routeGeometry.map((feature, index) => {
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
                color: generateRouteColor(route),
                weight: 4,
                opacity: 0.6,
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
              <div className="p-3 min-w-[200px]">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white" style={{color: generateRouteColor(vehicle.label)}}>
                  Route {vehicle.label}
                </h3>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                  <p><span className="font-semibold text-gray-900 dark:text-white">Vehicle:</span> {vehicle.VehicleID}</p>
                  <p><span className="font-semibold text-gray-900 dark:text-white">Direction:</span> {vehicle.Direction}</p>
                  <p><span className="font-semibold text-gray-900 dark:text-white">Destination:</span> {vehicle.destination}</p>
                  {vehicle.late > 0 && (
                    <p className="text-red-600 dark:text-red-400 font-semibold">⚠️ Late: {vehicle.late} min</p>
                  )}
                  {vehicle.late === 0 && (
                    <p className="text-green-600 dark:text-green-400 font-semibold">✅ On time</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {loading && (
        <div className="absolute top-20 left-4 bg-white/65 dark:bg-gray-800/65 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-900 dark:text-white">Loading vehicle data...</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-white/65 dark:bg-gray-800/65 backdrop-blur-sm rounded-lg shadow-lg z-[1000] w-64 transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-between p-3 pb-2">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Routes ({selectedRoutes.length}/10)</h3>
          <button
            onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
            title={isLegendCollapsed ? 'Expand legend' : 'Collapse legend'}
          >
            <svg
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                isLegendCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isLegendCollapsed ? 'max-h-0' : 'max-h-[400px]'
        }`}>
          <div className="px-3 pb-3">
            {/* Route Search Interface */}
            <div className="mb-3 border-b border-gray-200 dark:border-gray-600 pb-3">
          <input
            type="text"
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 mb-2 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={selectedRoutes.length >= 10}
          />
              {searchQuery && (
                <div className="mt-1 max-h-24 overflow-y-auto text-xs">
                  {filteredRoutes.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 py-1">No routes found</div>
                  ) : (
                    filteredRoutes.map(route => (
                      <button
                        key={route.number}
                        onClick={() => addRoute(route.number)}
                        className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-900 dark:text-white"
                        disabled={selectedRoutes.length >= 10}
                      >
                        <span className="font-semibold">{route.number}</span> - {route.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Selected Routes List */}
            <div className="text-xs space-y-1">
              {selectedRoutes.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-center py-2">
                  No routes selected. Click &quot;+ Add&quot; to add routes.
                </div>
              ) : (
                selectedRoutes.map(route => {
                  const count = vehicles.filter(v => v.label === route).length;
                  return (
                    <div key={route} className="grid grid-cols-[16px_1fr_24px_20px] gap-2 items-center">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{backgroundColor: generateRouteColor(route)}}
                      ></div>
                      <span className="text-gray-900 dark:text-white">Route {route}</span>
                      <span className="italic text-right text-gray-600 dark:text-gray-300">({count})</span>
                      <button
                        onClick={() => removeRoute(route)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold text-center"
                        title="Remove route"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
              Total vehicles: {vehicles.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}