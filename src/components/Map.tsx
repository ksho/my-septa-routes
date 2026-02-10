'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, CircleMarker, useMap } from 'react-leaflet';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isRegionalRailRoute } from '@/constants/routes';
import { PHILADELPHIA_CENTER, DEFAULT_ROUTES } from '@/constants/map.constants';
import { generateRouteColor } from '@/utils/routeColors';
import { createRouteIcon } from '@/utils/routeIcons';
import type { RouteGeometry } from '@/utils/mapHelpers';
import { LocationControl } from './LocationControl';

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
  type?: string;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

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

  // Location sharing state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isManuallyDragged, setIsManuallyDragged] = useState(false);
  const hasInitialZoomRef = useRef(false);

  // Zoom level state for dynamic line weight
  const [currentZoom, setCurrentZoom] = useState(13);

  // Vehicle tracking state - detect if user is on a bus
  const [trackedVehicle, setTrackedVehicle] = useState<{ vehicleId: string; route: string; startTime: number } | null>(null);
  const [detectedRide, setDetectedRide] = useState<{ vehicleId: string; route: string } | null>(null);

  // Determine if we should use dark theme
  const isDark = mounted ? (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) : false;

  // Check if location tracking was enabled in previous session
  const getInitialZoom = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locationSharingEnabled');
      return saved === 'true' ? 15 : 13;
    }
    return 13;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load location sharing preference from localStorage
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem('locationSharingEnabled');
    if (saved === 'true') {
      setLocationEnabled(true);
    }
  }, [mounted]);

  // Handle location sharing toggle
  const handleLocationToggle = useCallback(() => {
    const newValue = !locationEnabled;
    setLocationEnabled(newValue);
    localStorage.setItem('locationSharingEnabled', String(newValue));
    // Reset manual drag state when disabling location
    if (!newValue) {
      setIsManuallyDragged(false);
    }
  }, [locationEnabled]);

  // Handle map drag start
  const handleMapDragStart = useCallback(() => {
    if (locationEnabled) {
      setIsManuallyDragged(true);
    }
  }, [locationEnabled]);

  // Handle re-center button click
  const handleRecenter = useCallback(() => {
    setIsManuallyDragged(false);
  }, []);

  // Handle zoom change
  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  // Calculate line weight based on zoom level
  const getLineWeight = (zoom: number): number => {
    if (zoom <= 12) return 2;      // Zoomed out: thin lines
    if (zoom <= 14) return 2.5;    // Medium zoom: medium-thin lines
    return 3.5;                    // Zoomed in: medium lines
  };

  // Calculate distance between two coordinates in meters (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

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
      
      // Separate routes by type
      const busAndTrolleyRoutes = selectedRoutes.filter(route => !isRegionalRailRoute(route));
      const railRoutes = selectedRoutes.filter(route => isRegionalRailRoute(route));
      
      const allFeatures: RouteFeature[] = [];
      
      // Fetch bus and trolley geometry
      if (busAndTrolleyRoutes.length > 0) {
        try {
          const busResponse = await fetch(`/api/routes?routes=${busAndTrolleyRoutes.join(',')}`);
          if (busResponse.ok) {
            const busData = await busResponse.json();
            if (busData.features && Array.isArray(busData.features)) {
              console.log('Bus/trolley features found:', busData.features.length);
              allFeatures.push(...busData.features);
            }
          }
        } catch (error) {
          console.error('Error fetching bus/trolley geometry:', error);
        }
      }
      
      // Fetch Regional Rail geometry
      if (railRoutes.length > 0) {
        try {
          const railResponse = await fetch(`/api/rail-geometry?routes=${railRoutes.join(',')}`);
          if (railResponse.ok) {
            const railData = await railResponse.json();
            if (railData.features && Array.isArray(railData.features)) {
              console.log('Rail features found:', railData.features.length);
              allFeatures.push(...railData.features);
            }
          }
        } catch (error) {
          console.error('Error fetching rail geometry:', error);
        }
      }
      
      console.log('Combined route geometry data received, total features:', allFeatures.length);
      setRouteGeometry(allFeatures);
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
      // Use optimized bulk endpoint - fetches all routes in a single API call
      // This reduces Vercel function invocations from N to 1 (massive cost savings)
      const routesParam = selectedRoutes.join(',');
      const response = await fetch(`/api/vehicles?routes=${encodeURIComponent(routesParam)}`);

      if (!response.ok) {
        console.warn(`Failed to fetch vehicle data: ${response.status}`);
        setVehicles([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.bus && Array.isArray(data.bus)) {
        // Filter out invalid coordinates
        const validVehicles = data.bus.filter((vehicle: Vehicle) =>
          !isNaN(vehicle.lat) &&
          !isNaN(vehicle.lng) &&
          vehicle.lat !== 0 &&
          vehicle.lng !== 0
        );
        setVehicles(validVehicles);
      } else {
        setVehicles([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setVehicles([]);
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

  // Detect if user is on a bus by tracking proximity to vehicles
  useEffect(() => {
    if (!userLocation || !locationEnabled || vehicles.length === 0) {
      setTrackedVehicle(null);
      setDetectedRide(null);
      return;
    }

    const PROXIMITY_THRESHOLD = 50; // meters - consider user "on" vehicle if within this distance
    const DETECTION_TIME = 15000; // 15 seconds in milliseconds

    // Find the closest vehicle
    let closestVehicle: Vehicle | null = null;
    let closestDistance = Infinity;

    vehicles.forEach(vehicle => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        vehicle.lat,
        vehicle.lng
      );

      if (distance <= PROXIMITY_THRESHOLD && distance < closestDistance) {
        closestVehicle = vehicle;
        closestDistance = distance;
      }
    });

    if (closestVehicle !== null) {
      const currentVehicle: Vehicle = closestVehicle;
      const vehicleId = currentVehicle.VehicleID;
      const route = currentVehicle.label;

      // Check if we're already tracking this vehicle
      if (trackedVehicle && trackedVehicle.vehicleId === vehicleId) {
        const timeTracking = Date.now() - trackedVehicle.startTime;

        // If we've been near this vehicle for 15+ seconds, mark as detected
        if (timeTracking >= DETECTION_TIME && !detectedRide) {
          console.log(`Detected user on ${route} - Vehicle ${vehicleId}`);
          setDetectedRide({ vehicleId, route });
        }
      } else {
        // Start tracking a new vehicle
        console.log(`Started tracking proximity to ${route} - Vehicle ${vehicleId}`);
        setTrackedVehicle({ vehicleId, route, startTime: Date.now() });
        setDetectedRide(null); // Clear any previous detection
      }
    } else {
      // Not near any vehicle, reset tracking
      if (trackedVehicle) {
        console.log('No longer near any vehicle');
      }
      setTrackedVehicle(null);
      setDetectedRide(null);
    }
  }, [userLocation, vehicles, locationEnabled, trackedVehicle, detectedRide]);

  // Handle geolocation tracking
  useEffect(() => {
    if (!locationEnabled) {
      // Stop watching position
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setUserLocation(null);
      setLocationError(null);
      hasInitialZoomRef.current = false;
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationEnabled(false);
      return;
    }

    const successCallback = (position: GeolocationPosition) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLocationError(null);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      let errorMessage = 'Unable to retrieve your location';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }

      setLocationError(errorMessage);
      setLocationEnabled(false);
      setUserLocation(null);
    };

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // 10 seconds
        timeout: 5000 // 5 seconds
      }
    );

    setWatchId(id);

    // Cleanup
    return () => {
      navigator.geolocation.clearWatch(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationEnabled]); // watchId intentionally excluded to prevent infinite loop

  // Inner component to detect map drag events
  function DragDetector({ onDragStart }: { onDragStart: () => void }) {
    const map = useMap();

    useEffect(() => {
      const handleDragStart = () => {
        onDragStart();
      };

      map.on('dragstart', handleDragStart);

      return () => {
        map.off('dragstart', handleDragStart);
      };
    }, [map, onDragStart]);

    return null;
  }

  // Inner component to track zoom level
  function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
    const map = useMap();

    useEffect(() => {
      const handleZoom = () => {
        onZoomChange(map.getZoom());
      };

      map.on('zoomend', handleZoom);
      // Set initial zoom
      onZoomChange(map.getZoom());

      return () => {
        map.off('zoomend', handleZoom);
      };
    }, [map, onZoomChange]);

    return null;
  }

  // Inner component to create custom pane for user location marker
  function UserLocationPane() {
    const map = useMap();

    useEffect(() => {
      // Create a custom pane with higher z-index for user location marker
      if (!map.getPane('userLocationPane')) {
        const pane = map.createPane('userLocationPane');
        pane.style.zIndex = '650'; // Higher than marker pane (600) but lower than popup pane (700)
      }
    }, [map]);

    return null;
  }

  // Inner component to control map viewport
  function MapController({ userLocation, enabled, isManuallyDragged, hasInitialZoomRef }: {
    userLocation: { lat: number; lng: number } | null;
    enabled: boolean;
    isManuallyDragged: boolean;
    hasInitialZoomRef: React.MutableRefObject<boolean>;
  }) {
    const map = useMap();
    const previouslyDraggedRef = useRef(false);

    useEffect(() => {
      // Check if user just clicked re-center (transition from dragged to not dragged)
      const justRecentered = previouslyDraggedRef.current && !isManuallyDragged;
      previouslyDraggedRef.current = isManuallyDragged;

      if (enabled && userLocation && !isManuallyDragged) {
        if (!hasInitialZoomRef.current || justRecentered) {
          // First time or just re-centered: fly to user location
          console.log(justRecentered ? 'Re-centering to:' : 'Initial zoom to:', userLocation);
          map.flyTo([userLocation.lat, userLocation.lng], justRecentered ? map.getZoom() : 15, {
            duration: 1.5,
            easeLinearity: 0.25
          });
          if (!hasInitialZoomRef.current) {
            hasInitialZoomRef.current = true;
          }
        } else {
          // Subsequent updates: only pan, don't change zoom
          console.log('Panning to:', userLocation);
          map.panTo([userLocation.lat, userLocation.lng], {
            animate: true,
            duration: 1.0
          });
        }
      }
    }, [userLocation, enabled, isManuallyDragged, map, hasInitialZoomRef]);

    return null;
  }

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={PHILADELPHIA_CENTER}
        zoom={getInitialZoom()}
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

          // Helper function to check if two points are the same
          const pointsMatch = (p1: [number, number], p2: [number, number], tolerance = 0.0001): boolean => {
            return Math.abs(p1[0] - p2[0]) < tolerance && Math.abs(p1[1] - p2[1]) < tolerance;
          };

          // Helper function to calculate angle between two points
          const getAngle = (p1: [number, number], p2: [number, number]): number => {
            return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
          };

          // Helper function to check if two segments are directionally aligned
          const segmentsAligned = (seg1End: [number, number][], seg2Start: [number, number][]): boolean => {
            if (seg1End.length < 2 || seg2Start.length < 2) return true; // Can't determine, allow merge

            // Get last few points of first segment and first few points of second segment
            const seg1Point1 = seg1End[seg1End.length - 2];
            const seg1Point2 = seg1End[seg1End.length - 1];
            const seg2Point1 = seg2Start[0];
            const seg2Point2 = seg2Start[1];

            const angle1 = getAngle(seg1Point1, seg1Point2);
            const angle2 = getAngle(seg2Point1, seg2Point2);

            // Calculate absolute difference in angles
            let angleDiff = Math.abs(angle1 - angle2);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            // Allow merge if angles are within 60 degrees (π/3 radians)
            return angleDiff < Math.PI / 3;
          };

          // Helper function to merge connected segments
          const mergeConnectedSegments = (segments: [number, number][][]): [number, number][][] => {
            if (segments.length <= 1) return segments;

            const MAX_MERGED_POINTS = 1000; // Prevent merging too many points into one segment
            const merged: [number, number][][] = [];
            let current = [...segments[0]];

            for (let i = 1; i < segments.length; i++) {
              const segment = segments[i];
              const currentEnd = current[current.length - 1];
              const segmentStart = segment[0];

              // Check if this segment connects to the current one and won't exceed max length
              const wouldExceedMax = (current.length + segment.length - 1) > MAX_MERGED_POINTS;
              const pointsConnect = pointsMatch(currentEnd, segmentStart);
              const aligned = segmentsAligned(current.slice(-3), segment.slice(0, 3));

              if (pointsConnect && !wouldExceedMax && aligned) {
                // Merge by appending all points except the duplicate first point
                current.push(...segment.slice(1));
              } else {
                // Not connected, misaligned, or would be too long - start a new merged segment
                merged.push(current);
                current = [...segment];
              }
            }

            // Add the last segment
            merged.push(current);
            return merged;
          };

          // Convert GeoJSON coordinates to Leaflet format
          let coordinateSets: [number, number][][] = [];

          if (feature.geometry.type === 'LineString') {
            const coords = feature.geometry.coordinates as [number, number][];
            coordinateSets = [coords.map(coord =>
              [coord[1], coord[0]] as [number, number]
            )];
          } else if (feature.geometry.type === 'MultiLineString') {
            const coords = feature.geometry.coordinates as [number, number][][];
            const segments = coords.map(lineString =>
              lineString.map(coord => [coord[1], coord[0]] as [number, number])
            );
            // Merge connected segments to avoid overlap artifacts
            coordinateSets = mergeConnectedSegments(segments);
          }

          console.log('Route', route, 'has', coordinateSets.length, 'merged line segments');
          
          return coordinateSets.map((coordinates, segmentIndex) => (
            <Polyline
              key={`route-${route}-${index}-${segmentIndex}`}
              positions={coordinates}
              pathOptions={{
                color: generateRouteColor(route),
                weight: getLineWeight(currentZoom),
                opacity: isDark ? 0.3 : 0.45,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              smoothFactor={8.0}
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
              <div style={{ padding: '12px', minWidth: '200px' }}>
                <h3 style={{ 
                  fontWeight: 'bold', 
                  fontSize: '18px', 
                  marginBottom: '8px', 
                  color: generateRouteColor(vehicle.label)
                }}>
                  {isRegionalRailRoute(vehicle.label)
                    ? `Rail ${vehicle.label}`
                    : vehicle.label.startsWith('T') 
                    ? `Trolley ${vehicle.label}`
                    : `Route ${vehicle.label}`}
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  <p style={{ marginBottom: '4px' }}>
                    <span className="popup-label">Vehicle:</span> 
                    <span className="popup-text"> {vehicle.VehicleID}</span>
                  </p>
                  <p style={{ marginBottom: '4px' }}>
                    <span className="popup-label">Direction:</span> 
                    <span className="popup-text"> {vehicle.Direction}</span>
                  </p>
                  <p style={{ marginBottom: '4px' }}>
                    <span className="popup-label">Destination:</span> 
                    <span className="popup-text"> {vehicle.destination}</span>
                  </p>
                  {vehicle.late > 0 && (
                    <p className="popup-late" style={{ marginBottom: '0' }}>⚠️ Late: {vehicle.late} min</p>
                  )}
                  {vehicle.late === 0 && (
                    <p className="popup-ontime" style={{ marginBottom: '0' }}>✅ On time</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Track zoom level for dynamic line weight */}
        <ZoomTracker onZoomChange={handleZoomChange} />

        {/* Create custom pane for user location marker */}
        <UserLocationPane />

        {/* Drag detector for manual map dragging */}
        <DragDetector onDragStart={handleMapDragStart} />

        {/* Map controller for viewport management */}
        <MapController
          userLocation={userLocation}
          enabled={locationEnabled}
          isManuallyDragged={isManuallyDragged}
          hasInitialZoomRef={hasInitialZoomRef}
        />

        {/* User location marker */}
        {userLocation && locationEnabled && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pane="userLocationPane"
            pathOptions={{
              color: '#FFFFFF',
              fillColor: '#4285F4',
              fillOpacity: 0.85,
              weight: 3,
            }}
            eventHandlers={{
              add: (e) => {
                const path = e.target.getElement();
                if (path) {
                  path.classList.add('user-location-marker', 'user-location-ring');
                }
              }
            }}
          >
            <Popup>
              <div style={{ padding: '8px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '4px' }}>Your Location</h3>
                <p style={{ fontSize: '12px', margin: 0 }}>
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
      
      {loading && (
        <div className="absolute top-20 left-4 bg-white/65 dark:bg-gray-800/65 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-900 dark:text-white">Loading vehicle data...</span>
          </div>
        </div>
      )}

      {/* Location error banner */}
      {locationError && (
        <div className="absolute top-20 right-4 bg-red-500/90 dark:bg-red-600/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <div className="flex items-start space-x-2">
            <span className="text-white text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{locationError}</p>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="text-white hover:text-gray-200 font-bold text-lg leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Detected ride notification */}
      {detectedRide && (
        <div className="absolute top-20 left-4 bg-blue-500/90 dark:bg-blue-600/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <div className="flex items-start space-x-2">
            <span className="text-white text-xl">🚌</span>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                Riding {isRegionalRailRoute(detectedRide.route)
                  ? `Rail ${detectedRide.route}`
                  : detectedRide.route.startsWith('T')
                  ? `Trolley ${detectedRide.route}`
                  : `Route ${detectedRide.route}`}
              </p>
              <p className="text-white text-xs opacity-90">Vehicle {detectedRide.vehicleId}</p>
            </div>
            <button
              onClick={() => setDetectedRide(null)}
              className="text-white hover:text-gray-200 font-bold text-lg leading-none"
              aria-label="Dismiss notification"
            >
              ×
            </button>
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
                      <span className="text-gray-900 dark:text-white">
                        {isRegionalRailRoute(route)
                          ? `Rail ${route}`
                          : route.startsWith('T') 
                          ? `Trolley ${route}`
                          : `Route ${route}`}
                      </span>
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

      {/* Location sharing control */}
      <div className="absolute top-16 right-4 z-[1000]">
        <LocationControl
          enabled={locationEnabled}
          onToggle={handleLocationToggle}
          hasError={!!locationError}
          showRecenter={isManuallyDragged}
          onRecenter={handleRecenter}
        />
      </div>
    </div>
  );
}