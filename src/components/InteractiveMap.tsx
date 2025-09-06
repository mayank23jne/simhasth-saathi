import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, Navigation, Focus, Layers, Settings, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useGroup } from '@/context/GroupContext';
import { useTranslation } from '@/context/TranslationContext';
import { GeoFenceAlert } from './GeoFenceAlert';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SafeZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // in meters
  type: 'safe' | 'restricted' | 'medical' | 'police';
}

interface RouteData {
  id: string;
  name: string;
  points: Array<{ lat: number; lng: number }>;
  type: 'walking' | 'emergency' | 'scenic';
  difficulty: 'easy' | 'moderate' | 'hard';
  duration: string;
  description: string;
}

interface InteractiveMapProps {
  className?: string;
  showControls?: boolean;
  enableGeofencing?: boolean;
  showRoutes?: boolean;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const safeZones: SafeZone[] = [
  {
    id: 'zone1',
    name: 'मुख्य घाट सुरक्षित क्षेत्र',
    center: { lat: 23.1765, lng: 75.7884 },
    radius: 500,
    type: 'safe'
  },
  {
    id: 'zone2',
    name: 'महाकाल मंदिर परिसर',
    center: { lat: 23.1825, lng: 75.7685 },
    radius: 300,
    type: 'safe'
  },
  {
    id: 'zone3',
    name: 'मेडिकल कैंप क्षेत्र',
    center: { lat: 23.1750, lng: 75.7900 },
    radius: 200,
    type: 'medical'
  },
  {
    id: 'zone4',
    name: 'पुलिस कंट्रोल जोन',
    center: { lat: 23.1780, lng: 75.7850 },
    radius: 150,
    type: 'police'
  }
];

const popularRoutes: RouteData[] = [
  {
    id: 'route1',
    name: 'मुख्य घाट से महाकाल मंदिर',
    points: [
      { lat: 23.1765, lng: 75.7884 },
      { lat: 23.1780, lng: 75.7850 },
      { lat: 23.1800, lng: 75.7750 },
      { lat: 23.1825, lng: 75.7685 }
    ],
    type: 'walking',
    difficulty: 'easy',
    duration: '25 मिनट',
    description: 'सबसे सुरक्षित और आसान रास्ता'
  },
  {
    id: 'route2',
    name: 'आपातकालीन निकास मार्ग',
    points: [
      { lat: 23.1825, lng: 75.7685 },
      { lat: 23.1810, lng: 75.7720 },
      { lat: 23.1790, lng: 75.7800 },
      { lat: 23.1765, lng: 75.7884 }
    ],
    type: 'emergency',
    difficulty: 'easy',
    duration: '15 मिनट',
    description: 'आपातकाल में तुरंत निकलने का रास्ता'
  }
];

// Custom icons
const createCustomIcon = (color: string, type: 'user' | 'member' | 'help' = 'member') => {
  const iconHtml = type === 'user' 
    ? `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`
    : type === 'help'
    ? `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 4px; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px;">H</span></div>`
    : `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const getZoneColor = (type: string) => {
  switch (type) {
    case 'safe': return '#10b981'; // green
    case 'restricted': return '#f59e0b'; // amber
    case 'medical': return '#ef4444'; // red
    case 'police': return '#3b82f6'; // blue
    default: return '#6b7280';
  }
};

const getRouteColor = (type: string) => {
  switch (type) {
    case 'walking': return '#10b981'; // green
    case 'emergency': return '#ef4444'; // red
    case 'scenic': return '#8b5cf6'; // purple
    default: return '#6b7280';
  }
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  className = '',
  showControls = true,
  enableGeofencing = true,
  showRoutes = false,
  onLocationUpdate
}) => {
  const { t } = useTranslation();
  const { members, userLocation, setUserLocation } = useGroup();
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [showLayers, setShowLayers] = useState({
    safeZones: true,
    routes: showRoutes,
    heatmap: false,
    traffic: false
  });
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [geofenceAlerts, setGeofenceAlerts] = useState<Array<{
    id: string;
    member: string;
    zone: string;
    type: 'exit' | 'enter';
    timestamp: number;
    lat?: number;
    lng?: number;
  }>>([]);
  const [followMode, setFollowMode] = useState<'none' | 'user' | 'group'>('none');
  const watchIdRef = useRef<number | null>(null);

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation(latitude, longitude);
      onLocationUpdate?.(latitude, longitude);

      // Check geofence violations
      if (enableGeofencing) {
        checkGeofenceViolations(latitude, longitude);
      }
    };

    const error = (err: GeolocationPositionError) => {
      console.warn('Geolocation error:', err);
      toast.error('स्थान प्राप्त करने में समस्या');
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(success, error, options);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [setUserLocation, onLocationUpdate, enableGeofencing]);

  // Check geofence violations
  const checkGeofenceViolations = useCallback((lat: number, lng: number) => {
    safeZones.forEach(zone => {
      const distance = mapRef?.distance([lat, lng], [zone.center.lat, zone.center.lng]) || 0;
      
      // Simulate member movement and alerts
      if (zone.type === 'safe' && distance > zone.radius) {
        // Outside safe zone
        const alertId = `alert_${Date.now()}_${Math.random()}`;
        setGeofenceAlerts(prev => [...prev, {
          id: alertId,
          member: 'आप',
          zone: zone.name,
          type: 'exit',
          timestamp: Date.now(),
          lat,
          lng
        }]);
        
        // Remove alert after 10 seconds
        setTimeout(() => {
          setGeofenceAlerts(prev => prev.filter(a => a.id !== alertId));
        }, 10000);
      }
    });
  }, [mapRef]);

  // Auto-follow logic
  useEffect(() => {
    if (!mapRef) return;

    if (followMode === 'user' && userLocation) {
      mapRef.setView([userLocation.lat, userLocation.lng], mapRef.getZoom(), {
        animate: true,
        duration: 0.5
      });
    } else if (followMode === 'group' && members.length > 0) {
      const bounds = L.latLngBounds(
        members
          .filter(m => m.position)
          .map(m => [m.position!.lat, m.position!.lng])
      );
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      mapRef.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [mapRef, followMode, userLocation, members]);

  const handleFocusUser = useCallback(() => {
    if (userLocation && mapRef) {
      mapRef.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
      setFollowMode('user');
      toast.success('आपकी स्थिति पर केंद्रित');
    }
  }, [userLocation, mapRef]);

  const handleFocusGroup = useCallback(() => {
    if (mapRef && members.length > 0) {
      const bounds = L.latLngBounds(
        members
          .filter(m => m.position)
          .map(m => [m.position!.lat, m.position!.lng])
      );
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      mapRef.fitBounds(bounds, { padding: [50, 50], animate: true });
      setFollowMode('group');
      toast.success('समूह पर केंद्रित');
    }
  }, [mapRef, members, userLocation]);

  const handleRouteSelect = useCallback((routeId: string) => {
    setSelectedRoute(selectedRoute === routeId ? null : routeId);
    toast.success(`रूट ${selectedRoute === routeId ? 'छुपाया गया' : 'दिखाया गया'}`);
  }, [selectedRoute]);

  const handleLayerToggle = useCallback((layer: keyof typeof showLayers) => {
    setShowLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  const dismissGeofenceAlert = useCallback((id: string) => {
    setGeofenceAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const viewAlertLocation = useCallback((lat: number, lng: number, label: string) => {
    if (mapRef) {
      mapRef.setView([lat, lng], 16, { animate: true });
      toast.success(`${label} स्थान दिखाया गया`);
    }
  }, [mapRef]);

  const defaultCenter: [number, number] = useMemo(() => 
    userLocation ? [userLocation.lat, userLocation.lng] : [23.1765, 75.7884], 
    [userLocation]
  );

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={15}
        className="h-full w-full rounded-lg"
        ref={setMapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={createCustomIcon('#3b82f6', 'user')}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">आपकी स्थिति</h3>
                <p className="text-sm text-muted-foreground">
                  {t('youAreHere')}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Group Members */}
        {members.filter(m => !m.isSelf && m.position).map((member) => (
          <Marker
            key={member.id}
            position={[member.position!.lat, member.position!.lng]}
            icon={createCustomIcon('#10b981')}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">
                  अंतिम अपडेट: {member.lastUpdated ? new Date(member.lastUpdated).toLocaleTimeString('hi-IN') : 'अज्ञात'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Safe Zones */}
        {showLayers.safeZones && safeZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.center.lat, zone.center.lng]}
            radius={zone.radius}
            pathOptions={{
              color: getZoneColor(zone.type),
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.2
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{zone.name}</h3>
                <p className="text-sm text-muted-foreground">
                  प्रकार: {zone.type === 'safe' ? 'सुरक्षित' : zone.type === 'medical' ? 'चिकित्सा' : 'पुलिस'}
                </p>
                <p className="text-xs">
                  रेडियस: {zone.radius} मीटर
                </p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Routes */}
        {showLayers.routes && popularRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points.map(p => [p.lat, p.lng])}
            pathOptions={{
              color: selectedRoute === route.id ? getRouteColor(route.type) : '#94a3b8',
              weight: selectedRoute === route.id ? 4 : 2,
              opacity: selectedRoute === route.id ? 0.8 : 0.5
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{route.name}</h3>
                <p className="text-sm text-muted-foreground">{route.description}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{route.difficulty === 'easy' ? 'आसान' : route.difficulty === 'moderate' ? 'मध्यम' : 'कठिन'}</Badge>
                    <span>{route.duration}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 space-y-2 z-[1000]">
          {/* Location Controls */}
          <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-2 space-y-2 shadow-lg">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8"
              onClick={handleFocusUser}
            >
              <Navigation className="h-3 w-3 mr-1" />
              मैं
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8"
              onClick={handleFocusGroup}
            >
              <Users className="h-3 w-3 mr-1" />
              समूह
            </Button>
          </div>

          {/* Layer Controls */}
          <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-2 space-y-2 shadow-lg">
            <Button
              variant={showLayers.safeZones ? "default" : "outline"}
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => handleLayerToggle('safeZones')}
            >
              <Shield className="h-3 w-3 mr-1" />
              सुरक्षित क्षेत्र
            </Button>
            <Button
              variant={showLayers.routes ? "default" : "outline"}
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => handleLayerToggle('routes')}
            >
              <Navigation className="h-3 w-3 mr-1" />
              रूट
            </Button>
          </div>
        </div>
      )}

      {/* Route Selection Panel */}
      <AnimatePresence>
        {showLayers.routes && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 z-[1000]"
          >
            <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm mb-2">लोकप्रिय रूट</h3>
                <div className="space-y-2">
                  {popularRoutes.map((route) => (
                    <Button
                      key={route.id}
                      variant={selectedRoute === route.id ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => handleRouteSelect(route.id)}
                    >
                      <div className="text-left">
                        <div className="font-medium text-xs">{route.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {route.duration} • {route.difficulty === 'easy' ? 'आसान' : route.difficulty === 'moderate' ? 'मध्यम' : 'कठिन'}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow Mode Indicator */}
      {followMode !== 'none' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4 z-[1000]"
        >
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Focus className="h-3 w-3 mr-1" />
            {followMode === 'user' ? 'आपको फॉलो कर रहा है' : 'समूह को फॉलो कर रहा है'}
          </Badge>
        </motion.div>
      )}

      {/* Geofence Alerts */}
      {enableGeofencing && (
        <GeoFenceAlert
          alerts={geofenceAlerts}
          onDismiss={dismissGeofenceAlert}
          onViewLocation={viewAlertLocation}
        />
      )}
    </div>
  );
};

export default InteractiveMap;