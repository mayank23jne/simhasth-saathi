import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { Users, AlertCircle, Navigation, Locate, Info, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { useTranslation } from '@/context/TranslationContext';
import { useGroup } from '@/context/GroupContext';
import { toast } from 'sonner';

// Group members are provided by GroupContext

// Smooth animation helpers
type LatLng = { lat: number; lng: number; ts?: number };
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function smoothMoveMarker(marker: L.Marker, to: LatLng, durationMs: number, animStateMap: Map<L.Marker, { raf?: number }>) {
  try {
    const fromLatLng = marker.getLatLng();
    const from = { lat: fromLatLng.lat, lng: fromLatLng.lng };
    const start = performance.now();
    const state = animStateMap.get(marker) || {};
    if ((state as any).raf) cancelAnimationFrame((state as any).raf);

    const step = (now: number) => {
      const elapsed = Math.min(1, (now - start) / durationMs);
      const t = easeInOutQuad(elapsed);
      const lat = lerp(from.lat, to.lat, t);
      const lng = lerp(from.lng, to.lng, t);
      marker.setLatLng([lat, lng]);

      if (elapsed < 1) {
        (state as any).raf = requestAnimationFrame(step);
        animStateMap.set(marker, state as any);
      } else {
        animStateMap.delete(marker);
      }
    };

    (state as any).raf = requestAnimationFrame(step);
    animStateMap.set(marker, state as any);
  } catch {
    marker.setLatLng([to.lat, to.lng]);
  }
}

// Smooth animation for a marker along a given path
function smoothMoveMarkerAlongPath(
  marker: L.Marker,
  path: LatLng[],
  animationState: React.MutableRefObject<Map<string, {
    raf?: number;
    currentPathIndex: number;
    segmentStartTime: number;
    segmentDuration: number;
    pathId: string;
  }>>,
  memberId: string,
  haversine: (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => number,
) {
  if (!path || path.length < 2) {
    return;
  }

  const WALK_SPEED_MPS = 5 * 1000 / 3600; // ~5 km/h in meters per second

  const state = animationState.current.get(memberId) || {
    currentPathIndex: 0,
    segmentStartTime: 0,
    segmentDuration: 0,
    pathId: ''
  };
  animationState.current.set(memberId, state);

  const startAnimation = (currentIndex: number) => {
    if (state.raf) cancelAnimationFrame(state.raf);

    const from = path[currentIndex];
    const to = path[currentIndex + 1];

    if (!from || !to) {
      animationState.current.delete(memberId);
      return;
    }

    const segmentDistance = haversine(from, to);
    state.segmentDuration = (segmentDistance / WALK_SPEED_MPS) * 1000; // ms
    state.segmentStartTime = performance.now();
    state.currentPathIndex = currentIndex;

    const step = (now: number) => {
      const elapsed = now - state.segmentStartTime;
      const t = Math.min(1, elapsed / state.segmentDuration);
      const eased = easeInOutQuad(t);

      const lat = lerp(from.lat, to.lat, eased);
      const lng = lerp(from.lng, to.lng, eased);
      marker.setLatLng([lat, lng]);

      if (t < 1) {
        state.raf = requestAnimationFrame(step);
      } else {
        // Move to the next segment
        if (currentIndex + 2 < path.length) {
          startAnimation(currentIndex + 1);
        } else {
          animationState.current.delete(memberId); // Animation complete
        }
      }
    };
    state.raf = requestAnimationFrame(step);
  };

  // Check if path has changed or if marker is at the end of the old path
  const currentPathString = JSON.stringify(path.map(p => `${p.lat},${p.lng}`));
  if (state.pathId !== currentPathString) {
    state.pathId = currentPathString;
    state.currentPathIndex = 0;
    startAnimation(0);
  } else if (state.currentPathIndex + 1 < path.length) {
    // Continue animation if still on the same path and not at the end
    startAnimation(state.currentPathIndex);
  } else if (path.length > 0) {
    // If at the end of the previous path, but new path has more points
    startAnimation(path.length - 2 >= 0 ? path.length - 2 : 0);
  }
}

const MapScreen: React.FC = () => {
  const { t } = useTranslation(); // ✅ Translation hook
  const { members, setUserLocation, userLocation, mapMode, helpdeskTarget, setMapMode } = useGroup();
  const [showGeofenceAlert, setShowGeofenceAlert] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerElRef = useRef<HTMLElement | null>(null);
  const userPathRef = useRef<L.Polyline | null>(null);
  const memberMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const helpdeskMarkerRef = useRef<L.Marker | null>(null);
  const helpdeskPolylineRef = useRef<L.Polyline | null>(null);
  const helpdeskRoutingControlRef = useRef<any>(null);
  const helpdeskRoutePopupRef = useRef<L.Popup | null>(null);
  const lastGeoUpdateTsRef = useRef<number>(0);
  const lastHeadingRef = useRef<number | undefined>(undefined);
  const prevHeadingRef = useRef<number>(0);
  const prevUserPosRef = useRef<LatLng | null>(null);
  const userAnimRefs = useRef<Map<L.Marker, { raf?: number }>>(new Map());
  const routingControlRef = useRef<any>(null);
  const routePopupRef = useRef<L.Popup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null); // fallback straight line
  const routeUpdateDebounceRef = useRef<number | null>(null);
  const selectedMemberRef = useRef<any | null>(null);
  const lastFitForMemberIdRef = useRef<string | null>(null);
  const mapCenterHintHandledRef = useRef<string | null>(null);
  const infoPanelRef = useRef<HTMLDivElement | null>(null);
  const infoButtonRef = useRef<HTMLButtonElement | null>(null);
  const memberAnimRefs = useRef<Map<L.Marker, { raf?: number }>>(new Map());

  // New refs for robust routing
  const osrmRoutingControlRef = useRef<any>(null);
  const fallbackRouteLineRef = useRef<L.Polyline | null>(null);
  const fallbackRoutePopupRef = useRef<L.Popup | null>(null);

  // New ref for member path animations
  const memberPathAnimStateRef = useRef<Map<string, {
    raf?: number;
    currentPathIndex: number;
    segmentStartTime: number;
    segmentDuration: number;
    pathId: string; // To detect if the path itself has changed
  }>>(new Map());

  // Static help centers
  const helpCenters = useMemo(() => ([
    { id: 'hc1', name: 'Ramghat Help Center', lat: 23.1769, lng: 75.7889 },
    { id: 'hc2', name: 'Mahakal Gate Help Center', lat: 23.1825, lng: 75.7685 },
    { id: 'hc3', name: 'Kalideh Road Help Center', lat: 23.1992, lng: 75.7841 },
  ]), []);

  const haversine = useCallback((a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }, []);

  const findNearestHelpCenter = useCallback((origin: { lat: number; lng: number }) => {
    let best = helpCenters[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const hc of helpCenters) {
      const dist = haversine(origin, { lat: hc.lat, lng: hc.lng });
      if (dist < bestDist) {
        best = hc;
        bestDist = dist;
      }
    }
    return { center: best, distanceM: bestDist } as const;
  }, [helpCenters, haversine]);

  // Directional triangle icons (rotated by heading)
  const buildDirectionalIcon = useCallback((color: string, headingDeg?: number, highlight?: boolean) => {
    const rotation = headingDeg ?? 0;
    const html = `
      <div class="direction-icon-wrapper" style="position: relative; will-change: transform; transform: rotate(${rotation}deg);">
        ${highlight ? '<div style="position:absolute; left:50%; top:50%; width:36px; height:36px; transform: translate(-50%, -50%); border-radius:50%; box-shadow: 0 0 0 6px rgba(37,99,235,0.20), 0 0 12px 4px rgba(37,99,235,0.25);"></div>' : ''}
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g>
            <polygon points="12,2 20,22 12,18 4,22" fill="${color}" stroke="white" stroke-width="2" />
          </g>
        </svg>
      </div>`;
    return L.divIcon({ html, className: 'direction-icon', iconSize: [24, 24], iconAnchor: [12, 12] });
  }, []);

  // Smoothly animate rotation without recreating the icon to avoid flicker
  const animateHeadingRotation = useCallback((fromDeg: number, toDeg: number, durationMs: number) => {
    const el = userMarkerElRef.current as HTMLElement | null;
    if (!el) return;
    const wrapper = el.querySelector('.direction-icon-wrapper') as HTMLElement | null;
    if (!wrapper) return;
    // normalize shortest rotation path
    let start = fromDeg;
    let end = toDeg;
    let delta = end - start;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const startTs = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTs) / durationMs);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const angle = start + delta * eased;
      wrapper.style.transform = `rotate(${angle}deg)`;
      if (t < 1) requestAnimationFrame(step);
      else lastHeadingRef.current = ((angle % 360) + 360) % 360;
    };
    requestAnimationFrame(step);
  }, []);

  // Helpdesk pin icon (SVG-based, no default Leaflet icon)
  const buildHelpdeskIcon = useCallback(() => {
    const svg = `
      <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="white" stroke-width="1.5" />
        <circle cx="12" cy="9" r="3.25" fill="white"/>
      </svg>`;
    return L.divIcon({ html: svg, className: 'helpdesk-pin', iconSize: [28, 28], iconAnchor: [14, 28] });
  }, []);

  // Track user location with tight throttling (0.8–1.2s) and feed into GroupContext
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const minInterval = 800 + Math.random() * 400; // faster cadence for smoother path
        if (now - lastGeoUpdateTsRef.current < minInterval) return;
        lastGeoUpdateTsRef.current = now;
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const heading = typeof position.coords.heading === 'number' && !Number.isNaN(position.coords.heading)
          ? position.coords.heading
          : undefined;
        // if browser heading missing, compute from last point
        if (heading == null && prevUserPosRef.current) {
          const dLat = userLat - prevUserPosRef.current.lat;
          const dLng = userLng - prevUserPosRef.current.lng;
          if (Math.abs(dLat) > 1e-9 || Math.abs(dLng) > 1e-9) {
            const rad = Math.atan2(dLng, dLat);
            const computed = ((rad * 180) / Math.PI + 360) % 360;
            prevHeadingRef.current = (lastHeadingRef.current ?? computed);
            lastHeadingRef.current = computed;
          }
        } else {
          if (typeof heading === 'number') {
            prevHeadingRef.current = (lastHeadingRef.current ?? heading);
            lastHeadingRef.current = heading;
          }
        }
        prevUserPosRef.current = { lat: userLat, lng: userLng };
        setUserLocation(userLat, userLng);
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation]);
const initializedRef = useRef(false);
const DEFAULT_ZOOM = 16; // default zoom at initialization

  // Mount user marker and path once when both map and user location exist
  useEffect(() => {
    if (!mapRef.current || !userLocation || userMarkerRef.current) return;
    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: buildDirectionalIcon('#2563eb', lastHeadingRef.current) }).addTo(mapRef.current);
    userMarkerRef.current = marker;
    userMarkerElRef.current = marker.getElement() as HTMLElement | null;
    const path = L.polyline([[userLocation.lat, userLocation.lng]], {
      color: '#2563eb', weight: 4, opacity: 0.7, renderer: L.canvas(),
    }).addTo(mapRef.current);
    userPathRef.current = path;
    // initial view without changing zoom level drastically
    mapRef.current.setView([userLocation.lat, userLocation.lng], mapRef.current.getZoom());
  }, [userLocation, buildDirectionalIcon]);

  // Imperatively update user marker and path on userLocation change (smooth)
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const map = mapRef.current;

    if (userMarkerRef.current) {
      smoothMoveMarker(userMarkerRef.current, userLocation, 280, userAnimRefs.current);
      // rotate smoothly between previous and latest heading
      const toHeading = typeof lastHeadingRef.current === 'number' ? lastHeadingRef.current : prevHeadingRef.current;
      const fromHeading = prevHeadingRef.current;
      animateHeadingRotation(fromHeading, toHeading, 260);
    }
    if (userPathRef.current) {
      userPathRef.current.addLatLng([userLocation.lat, userLocation.lng]);
    }

    // initial setView with default zoom only once
    if (!initializedRef.current) {
      map.setView([userLocation.lat, userLocation.lng], DEFAULT_ZOOM);
      initializedRef.current = true;
      return;
    }

    // auto-pan only if marker is near edge
    const bounds = map.getBounds();
    const latlng = L.latLng(userLocation.lat, userLocation.lng);
    if (!bounds.pad(-0.3).contains(latlng)) {
      map.panTo(latlng, { animate: true });
    }
  }, [userLocation, buildDirectionalIcon, animateHeadingRotation]);

  const groupStatus = useMemo(() => 'safe' as const, []);

  // Derived stats for info panel
  const { totalCount, alertCount, safeCount, lastUpdatedTs } = useMemo(() => {
    const total = members.length;
    const alerts = members.reduce((acc: number, m: any) => {
      const isAlert = m?.status === 'alert' || m?.isAlert === true || m?.alert === true;
      return acc + (isAlert ? 1 : 0);
    }, 0);
    const safe = Math.max(0, total - alerts);
    let latest = 0;
    for (const m of members as any[]) {
      if (Array.isArray(m?.path) && m.path.length > 0) {
        const ts = m.path[m.path.length - 1]?.ts ?? 0;
        if (typeof ts === 'number' && ts > latest) latest = ts;
      } else if (typeof (m as any)?.updatedAt === 'number') {
        if ((m as any).updatedAt > latest) latest = (m as any).updatedAt;
      }
    }
    return { totalCount: total, alertCount: alerts, safeCount: safe, lastUpdatedTs: latest };
  }, [members]);

  // Close info panel on outside click
  useEffect(() => {
    if (!showInfoPanel) return;
    const handler = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      if (!target) return;
      const inPanel = infoPanelRef.current && infoPanelRef.current.contains(target);
      const inButton = infoButtonRef.current && infoButtonRef.current.contains(target);
      if (!inPanel && !inButton) {
        setShowInfoPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showInfoPanel]);

  const handleLocate = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], mapRef.current.getZoom());
    }
  }, [userLocation]);

  const handleFocusGroup = useCallback(() => {
    if (!mapRef.current) return;

    const positions: [number, number][] = [];
    members.forEach((m: any) => {
      if (m?.position?.lat != null && m?.position?.lng != null) {
        positions.push([m.position.lat, m.position.lng]);
      }
    });
    if (userLocation) {
      positions.push([userLocation.lat, userLocation.lng]);
    }
    if (positions.length === 0) return;

    const bounds = L.latLngBounds(positions);
    mapRef.current.fitBounds(bounds.pad(0.2), { animate: true } as any);
  }, [members, userLocation]);

  const handleMarkerClick = useCallback((member: any) => () => setSelectedMember(member), []);

  // Debounced helper to update routing control waypoints or fallback line
  const updateLiveRoute = useCallback((map: L.Map, userPos: L.LatLng, memberPos: L.LatLng, selectedMemberId: string) => {
    if (routeUpdateDebounceRef.current) {
      window.clearTimeout(routeUpdateDebounceRef.current);
      routeUpdateDebounceRef.current = null;
    }

    routeUpdateDebounceRef.current = window.setTimeout(() => {
      const waypoints = [userPos, memberPos];

      const createOrUpdateRoutingControl = () => {
        if (osrmRoutingControlRef.current) {
          osrmRoutingControlRef.current.setWaypoints(waypoints);
        } else {
          const osrmRouter = (L as any).Routing.OSRMv1 ? new (L as any).Routing.OSRMv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }) : undefined;
          osrmRoutingControlRef.current = (L as any).Routing.control({
            waypoints,
            router: osrmRouter,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            show: false,
            showAlternatives: true,
            createMarker: () => null,
            lineOptions: { styles: [{ color: '#2563eb', weight: 5, opacity: 0.9 }] },
            altLineOptions: { styles: [{ color: '#9ca3af', weight: 4, opacity: 0.6, dashArray: '6,8' }] },
          })
            .on('routesfound', (e: any) => {
              const route = e.routes?.[0];
              if (!route) return;
              const distKm = (route.summary.totalDistance / 1000).toFixed(2);
              const etaMin = Math.round(route.summary.totalTime / 60);
              const midIndex = Math.floor(route.coordinates.length / 2);
              const mid = route.coordinates[midIndex];

              // Remove fallback elements if OSRM route is found
              if (fallbackRouteLineRef.current && map.hasLayer(fallbackRouteLineRef.current)) {
                map.removeLayer(fallbackRouteLineRef.current);
              }
              if (fallbackRoutePopupRef.current) {
                map.closePopup(fallbackRoutePopupRef.current);
                fallbackRoutePopupRef.current = null;
              }

              if (!routePopupRef.current) {
                routePopupRef.current = L.popup();
              }
              routePopupRef.current
                .setLatLng([mid.lat, mid.lng])
                .setContent(`<div><strong>${distKm} km</strong> • ${etaMin} min</div>`)
                .openOn(map);
            })
            .on('routingerror', () => {
              // OSRM failed, ensure fallback polyline is shown
              if (osrmRoutingControlRef.current && map.hasLayer(osrmRoutingControlRef.current)) {
                map.removeControl(osrmRoutingControlRef.current);
                osrmRoutingControlRef.current = null;
              }
              drawFallbackRoute(); // Make sure fallback is active
            })
            .addTo(map);
        }
        // Ensure fallback elements are removed if OSRM control is active or successfully created
        if (fallbackRouteLineRef.current && map.hasLayer(fallbackRouteLineRef.current)) {
          map.removeLayer(fallbackRouteLineRef.current);
        }
        if (fallbackRoutePopupRef.current) {
          map.closePopup(fallbackRoutePopupRef.current);
          fallbackRoutePopupRef.current = null;
        }
      };

      const drawFallbackRoute = () => {
        // Ensure OSRM control and its popup are removed if fallback is drawn
        if (osrmRoutingControlRef.current && map.hasLayer(osrmRoutingControlRef.current)) {
          map.removeControl(osrmRoutingControlRef.current);
          osrmRoutingControlRef.current = null;
        }
        if (routePopupRef.current) {
          map.closePopup(routePopupRef.current);
          routePopupRef.current = null;
        }

        if (!fallbackRouteLineRef.current) {
          fallbackRouteLineRef.current = L.polyline([userPos, memberPos], { color: '#2563eb', weight: 5, opacity: 0.9, renderer: L.canvas() }).addTo(map);
        } else {
          fallbackRouteLineRef.current.setLatLngs([userPos, memberPos]);
          if (!map.hasLayer(fallbackRouteLineRef.current)) map.addLayer(fallbackRouteLineRef.current);
        }
        const distM = map.distance(userPos, memberPos);
        const etaMin = Math.round((distM / 1.4) / 60);
        const mid = L.latLng((userPos.lat + memberPos.lat) / 2, (userPos.lng + memberPos.lng) / 2);
        if (!fallbackRoutePopupRef.current) fallbackRoutePopupRef.current = L.popup();
        fallbackRoutePopupRef.current
          .setLatLng(mid)
          .setContent(`<div><strong>${(distM / 1000).toFixed(2)} km</strong> • ${etaMin} min</div>`)
          .openOn(map);
      };

      // Always show a fallback route immediately
      drawFallbackRoute();
      // Then try to get the OSRM route
      createOrUpdateRoutingControl();

      // Fit bounds only when a new member is selected
      if (lastFitForMemberIdRef.current !== selectedMemberId) {
        const bounds = L.latLngBounds([userPos, memberPos]);
        map.fitBounds(bounds.pad(0.2), { animate: true } as any);
        lastFitForMemberIdRef.current = selectedMemberId;
      }

    }, 250);
  }, []);

  // Imperatively manage member markers for smooth updates (only in groups mode)
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapMode !== 'groups') {
      // remove any member markers when not in groups mode
      const map = mapRef.current;
      for (const [, marker] of memberMarkersRef.current.entries()) {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      }
      memberMarkersRef.current.clear();
      return;
    }
    const map = mapRef.current;
    const cache = memberMarkersRef.current;
    const presentIds = new Set<string>();
    members.filter(m => !m.isSelf).forEach((m) => {
      presentIds.add(m.id);
      const isSelected = !!(selectedMember && selectedMember.id === m.id);
      const icon = buildDirectionalIcon('#16a34a', m.headingDeg, isSelected);
      const existing = cache.get(m.id);

      const memberPath = m.path && Array.isArray(m.path) && m.path.length > 1 ? m.path : null;

      if (existing) {
        // Smoothly move marker along path if available, otherwise just update position
        if (memberPath) {
          smoothMoveMarkerAlongPath(existing, memberPath, memberPathAnimStateRef, m.id, haversine);
        } else {
          smoothMoveMarker(existing, m.position, 600, memberAnimRefs.current);
        }
        existing.setIcon(icon);
      } else {
        const initialPosition = memberPath && memberPath.length > 0 ? memberPath[0] : m.position;
        const newMarker = L.marker([initialPosition.lat, initialPosition.lng], { icon })
          .addTo(map)
          .bindTooltip(m.name, { permanent: true, direction: 'top', offset: L.point(0, -10) });
        newMarker.on('click', () => setSelectedMember(m));
        cache.set(m.id, newMarker);
        if (memberPath) {
          smoothMoveMarkerAlongPath(newMarker, memberPath, memberPathAnimStateRef, m.id, haversine);
        }
      }
    });
    // cleanup missing
    for (const [id, marker] of cache.entries()) {
      if (!presentIds.has(id)) {
        map.removeLayer(marker);
        cache.delete(id);
        // Clean up animation state for removed members
        if (memberPathAnimStateRef.current.has(id)) {
          const animState = memberPathAnimStateRef.current.get(id);
          if (animState && animState.raf) cancelAnimationFrame(animState.raf);
          memberPathAnimStateRef.current.delete(id);
        }
      }
    }
  }, [members, buildDirectionalIcon, mapMode, haversine]);

  // Clear selected member by clicking on the map background
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const onMapClick = () => setSelectedMember(null);
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, []);

  // Live path between user and selected member
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Resolve current selected member from live members array
    const selected = selectedMember ? members.find(m => m.id === selectedMember.id) : null;
    const userPos = userLocation ? L.latLng(userLocation.lat, userLocation.lng) : null;
    const memberPos = selected ? L.latLng(selected.position.lat, selected.position.lng) : null;

    if (userPos && memberPos && selected) {
      updateLiveRoute(map, userPos, memberPos, selected.id);
      selectedMemberRef.current = selected;
    } else {
      // No active selection -> remove routing and popup if exists
      if (osrmRoutingControlRef.current && map.hasLayer(osrmRoutingControlRef.current)) {
        map.removeControl(osrmRoutingControlRef.current);
        osrmRoutingControlRef.current = null;
      }
      if (routePopupRef.current) {
        map.closePopup(routePopupRef.current);
        routePopupRef.current = null;
      }
      if (fallbackRouteLineRef.current && map.hasLayer(fallbackRouteLineRef.current)) {
        map.removeLayer(fallbackRouteLineRef.current);
        fallbackRouteLineRef.current = null;
      }
      if (fallbackRoutePopupRef.current) {
        map.closePopup(fallbackRoutePopupRef.current);
        fallbackRoutePopupRef.current = null;
      }
      lastFitForMemberIdRef.current = null;
    }
  }, [selectedMember, members, userLocation, updateLiveRoute]);

  // Keep route updated as positions change (debounced)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const selected = selectedMemberRef.current ? members.find(m => m.id === selectedMemberRef.current.id) : null;
    if (!selected) return;
    if (!userLocation) return;
    const userPos = L.latLng(userLocation.lat, userLocation.lng);
    const memberPos = L.latLng(selected.position.lat, selected.position.lng);
    updateLiveRoute(map, userPos, memberPos, selected.id);
  }, [userLocation, members, updateLiveRoute]);

  // Center/highlight based on hint from other screens (e.g., SOS "View on Map")
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const checkMapCenterHint = () => {
      try {
        const raw = localStorage.getItem('mapCenter');
        if (!raw) return;
        if (mapCenterHintHandledRef.current === raw) return;
        const hint = JSON.parse(raw) as { lat: number; lng: number; ts?: number; source?: string } | null;
        if (!hint || typeof hint.lat !== 'number' || typeof hint.lng !== 'number') return;
        mapCenterHintHandledRef.current = raw;
        const latlng = L.latLng(hint.lat, hint.lng);
        map.flyTo(latlng, Math.max(map.getZoom(), 19));
        const highlight = L.circleMarker(latlng, {
          radius: 12,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.5,
          weight: 2,
        }).addTo(map);
        // auto remove highlight after a few seconds
        setTimeout(() => {
          if (map.hasLayer(highlight)) {
            map.removeLayer(highlight);
          }
        }, 5500);
      } catch {
        // ignore
      }
    };

    // initial check and on focus
    checkMapCenterHint();
    const onFocus = () => checkMapCenterHint();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Helpdesk mode: show only nearest help center marker and fly to it
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (mapMode === 'helpdesk' && helpdeskTarget) {
      // clear member markers
      for (const [, marker] of memberMarkersRef.current.entries()) {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      }
      memberMarkersRef.current.clear();
      // add or update helpdesk marker
      const latlng: [number, number] = [helpdeskTarget.lat, helpdeskTarget.lng];
      if (helpdeskMarkerRef.current) {
        helpdeskMarkerRef.current.setLatLng(latlng);
      } else {
        const marker = L.marker(latlng, { icon: buildHelpdeskIcon() }).addTo(map);
        helpdeskMarkerRef.current = marker;
        marker.on('click', () => {
          if (!userLocation) {
            toast.error('Location not available');
            return;
          }
          // clear any existing main routing elements when clicking on helpdesk marker
          if (fallbackRouteLineRef.current && map.hasLayer(fallbackRouteLineRef.current)) {
            map.removeLayer(fallbackRouteLineRef.current);
            fallbackRouteLineRef.current = null;
          }
          if (fallbackRoutePopupRef.current) {
            map.closePopup(fallbackRoutePopupRef.current);
            fallbackRoutePopupRef.current = null;
          }
          if (osrmRoutingControlRef.current && map.hasLayer(osrmRoutingControlRef.current)) {
            map.removeControl(osrmRoutingControlRef.current);
            osrmRoutingControlRef.current = null;
          }
          if (routePopupRef.current) {
            map.closePopup(routePopupRef.current);
            routePopupRef.current = null;
          }

          const userPos = L.latLng(userLocation.lat, userLocation.lng);
          const targetPos = L.latLng(latlng[0], latlng[1]);

          const createOrUpdateHelpdeskRouting = () => {
            if (helpdeskRoutingControlRef.current) {
              helpdeskRoutingControlRef.current.setWaypoints([userPos, targetPos]);
            } else {
              const osrmRouter = (L as any).Routing?.OSRMv1 ? new (L as any).Routing.OSRMv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }) : undefined;
              helpdeskRoutingControlRef.current = (L as any).Routing.control({
                waypoints: [userPos, targetPos],
                router: osrmRouter,
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                show: false,
                showAlternatives: true,
                lineOptions: { styles: [{ color: '#2563eb', weight: 5, opacity: 0.9 }] },
                altLineOptions: { styles: [{ color: '#9ca3af', weight: 4, opacity: 0.6, dashArray: '6,8' }] },
                createMarker: () => null,
              })
              .on('routesfound', (e: any) => {
                const route = e.routes?.[0];
                if (!route) return;
                const distKm = (route.summary.totalDistance / 1000).toFixed(2);
                const etaMin = Math.round(route.summary.totalTime / 60);
                const midIndex = Math.floor(route.coordinates.length / 2);
                const mid = route.coordinates[midIndex];
                if (helpdeskPolylineRef.current && map.hasLayer(helpdeskPolylineRef.current)) {
                  map.removeLayer(helpdeskPolylineRef.current);
                }
                if (!helpdeskRoutePopupRef.current) helpdeskRoutePopupRef.current = L.popup();
                helpdeskRoutePopupRef.current
                  .setLatLng([mid.lat, mid.lng])
                  .setContent(`<div><strong>${distKm} km</strong> • ${etaMin} min</div>`)
                  .openOn(map);
              })
              .on('routingerror', () => {
                // OSRM failed, draw fallback polyline
                drawHelpdeskFallbackRoute();
              })
              .addTo(map);
            }
            // Ensure fallback helpdesk polyline is removed if OSRM control is active or successfully created
            if (helpdeskPolylineRef.current && map.hasLayer(helpdeskPolylineRef.current)) {
              map.removeLayer(helpdeskPolylineRef.current);
            }
            if (helpdeskRoutePopupRef.current) {
              map.closePopup(helpdeskRoutePopupRef.current);
              helpdeskRoutePopupRef.current = null;
            }
          };

          const drawHelpdeskFallbackRoute = () => {
            // Ensure helpdesk OSRM control and its popup are removed if fallback is drawn
            if (helpdeskRoutingControlRef.current && map.hasLayer(helpdeskRoutingControlRef.current)) {
              map.removeControl(helpdeskRoutingControlRef.current);
              helpdeskRoutingControlRef.current = null;
            }
            if (!helpdeskPolylineRef.current) {
              helpdeskPolylineRef.current = L.polyline([userPos, targetPos], { color: '#2563eb', weight: 5, opacity: 0.9, renderer: L.canvas() }).addTo(map);
            } else {
              helpdeskPolylineRef.current.setLatLngs([userPos, targetPos]);
              if (!map.hasLayer(helpdeskPolylineRef.current)) map.addLayer(helpdeskPolylineRef.current);
            }
            const distM = map.distance(userPos, targetPos);
            const etaMin = Math.round((distM / 1.4) / 60);
            const mid = L.latLng((userPos.lat + targetPos.lat) / 2, (userPos.lng + targetPos.lng) / 2);
            if (!helpdeskRoutePopupRef.current) helpdeskRoutePopupRef.current = L.popup();
            helpdeskRoutePopupRef.current
              .setLatLng(mid)
              .setContent(`<div><strong>${(distM / 1000).toFixed(2)} km</strong> • ${etaMin} min</div>`)
              .openOn(map);
          };

          drawHelpdeskFallbackRoute(); // Always show fallback immediately
          createOrUpdateHelpdeskRouting(); // Then try to get OSRM route
        });
      }
      const label = `Nearest Help Center: ${helpdeskTarget.name}`;
      helpdeskMarkerRef.current.bindPopup(label).openPopup();
      map.flyTo(latlng, Math.max(map.getZoom(), 19));
      // Auto-draw route immediately (live like member path)
      if (userLocation) {
        // clear existing main routing if any
        if (osrmRoutingControlRef.current && map.hasLayer(osrmRoutingControlRef.current)) {
          map.removeControl(osrmRoutingControlRef.current);
          osrmRoutingControlRef.current = null;
        }
        if (routePopupRef.current) {
          map.closePopup(routePopupRef.current);
          routePopupRef.current = null;
        }
        if (fallbackRouteLineRef.current && map.hasLayer(fallbackRouteLineRef.current)) {
          map.removeLayer(fallbackRouteLineRef.current);
          fallbackRouteLineRef.current = null;
        }
        if (fallbackRoutePopupRef.current) {
          map.closePopup(fallbackRoutePopupRef.current);
          fallbackRoutePopupRef.current = null;
        }

        // clear existing helpdesk routing if any to re-draw
        if (helpdeskRoutingControlRef.current && map.hasLayer(helpdeskRoutingControlRef.current)) {
          map.removeControl(helpdeskRoutingControlRef.current);
          helpdeskRoutingControlRef.current = null;
        }
        if (helpdeskRoutePopupRef.current) {
          map.closePopup(helpdeskRoutePopupRef.current);
          helpdeskRoutePopupRef.current = null;
        }
        if (helpdeskPolylineRef.current && map.hasLayer(helpdeskPolylineRef.current)) {
          map.removeLayer(helpdeskPolylineRef.current);
          helpdeskPolylineRef.current = null;
        }

        const userPos = L.latLng(userLocation.lat, userLocation.lng);
        const targetPos = L.latLng(latlng[0], latlng[1]);

        const osrmRouter = (L as any).Routing?.OSRMv1 ? new (L as any).Routing.OSRMv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }) : undefined;
        const control = (L as any).Routing.control({
          waypoints: [userPos, targetPos],
          router: osrmRouter,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          show: false,
          showAlternatives: true,
          lineOptions: { styles: [{ color: '#2563eb', weight: 5, opacity: 0.9 }] },
          altLineOptions: { styles: [{ color: '#9ca3af', weight: 4, opacity: 0.6, dashArray: '6,8' }] },
          createMarker: () => null,
        })
        .on('routesfound', (e: any) => {
          const route = e.routes?.[0];
          if (!route) return;
          const distKm = (route.summary.totalDistance / 1000).toFixed(2);
          const etaMin = Math.round(route.summary.totalTime / 60);
          const midIndex = Math.floor(route.coordinates.length / 2);
          const mid = route.coordinates[midIndex];
          if (helpdeskPolylineRef.current && map.hasLayer(helpdeskPolylineRef.current)) {
            map.removeLayer(helpdeskPolylineRef.current);
          }
          if (!helpdeskRoutePopupRef.current) helpdeskRoutePopupRef.current = L.popup();
          helpdeskRoutePopupRef.current
            .setLatLng([mid.lat, mid.lng])
            .setContent(`<div><strong>${distKm} km</strong> • ${etaMin} min</div>`)
            .openOn(map);
        })
        .on('routingerror', () => {
          // OSRM failed, draw fallback polyline
          if (helpdeskRoutingControlRef.current && map.hasLayer(helpdeskRoutingControlRef.current)) {
            map.removeControl(helpdeskRoutingControlRef.current);
            helpdeskRoutingControlRef.current = null;
          }
          const fallbackDistM = map.distance(userPos, targetPos);
          const fallbackEtaMin = Math.round((fallbackDistM / 1.4) / 60);
          const fallbackMid = L.latLng((userPos.lat + targetPos.lat) / 2, (userPos.lng + targetPos.lng) / 2);
          if (!helpdeskPolylineRef.current) {
            helpdeskPolylineRef.current = L.polyline([userPos, targetPos], { color: '#2563eb', weight: 5, opacity: 0.9, renderer: L.canvas() }).addTo(map);
          } else {
            helpdeskPolylineRef.current.setLatLngs([userPos, targetPos]);
            if (!map.hasLayer(helpdeskPolylineRef.current)) map.addLayer(helpdeskPolylineRef.current);
          }
          if (!helpdeskRoutePopupRef.current) helpdeskRoutePopupRef.current = L.popup();
          helpdeskRoutePopupRef.current
            .setLatLng(fallbackMid)
            .setContent(`<div><strong>${(fallbackDistM / 1000).toFixed(2)} km</strong> • ${fallbackEtaMin} min</div>`)
            .openOn(map);
        })
        .addTo(map);
        helpdeskRoutingControlRef.current = control;
      }
    } else {
      // leaving helpdesk mode -> remove helpdesk marker and any routes/popups
      if (helpdeskMarkerRef.current && map.hasLayer(helpdeskMarkerRef.current)) {
        map.removeLayer(helpdeskMarkerRef.current);
        helpdeskMarkerRef.current = null;
      }
      if (helpdeskPolylineRef.current && map.hasLayer(helpdeskPolylineRef.current)) {
        map.removeLayer(helpdeskPolylineRef.current);
        helpdeskPolylineRef.current = null;
      }
      if (helpdeskRoutingControlRef.current && map.hasLayer(helpdeskRoutingControlRef.current)) {
        map.removeControl(helpdeskRoutingControlRef.current);
        helpdeskRoutingControlRef.current = null;
      }
      if (helpdeskRoutePopupRef.current) {
        map.closePopup(helpdeskRoutePopupRef.current);
        helpdeskRoutePopupRef.current = null;
      }
      // Also clear main routing controls when leaving helpdesk mode
      if (osrmRoutingControlRef.current && map.hasLayer(osrmRoutingControlRef.current)) {
        map.removeControl(osrmRoutingControlRef.current);
        osrmRoutingControlRef.current = null;
      }
      if (routePopupRef.current) {
        map.closePopup(routePopupRef.current);
        routePopupRef.current = null;
      }
      if (fallbackRouteLineRef.current && map.hasLayer(fallbackRouteLineRef.current)) {
        map.removeLayer(fallbackRouteLineRef.current);
        fallbackRouteLineRef.current = null;
      }
      if (fallbackRoutePopupRef.current) {
        map.closePopup(fallbackRoutePopupRef.current);
        fallbackRoutePopupRef.current = null;
      }
    }
  }, [mapMode, helpdeskTarget, userLocation, buildHelpdeskIcon]);

  // Live update the helpdesk route as user moves
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapMode !== 'helpdesk' || !helpdeskTarget) return;
    const map = mapRef.current;
    if (!userLocation) return;
    const userPos = L.latLng(userLocation.lat, userLocation.lng);
    const targetPos = L.latLng(helpdeskTarget.lat, helpdeskTarget.lng);
    if (helpdeskRoutingControlRef.current) {
      helpdeskRoutingControlRef.current.setWaypoints([userPos, targetPos]);
    }
  }, [userLocation, mapMode, helpdeskTarget]);

  const handleNearestHelpdesk = useCallback(() => {
    const origin = userLocation || (members.find((m: any) => m.isSelf)?.position ?? null);
    if (!origin) {
      toast.error('Location not available');
      return;
    }
    const { center } = findNearestHelpCenter(origin);
    setMapMode('helpdesk', { id: center.id, name: center.name, lat: center.lat, lng: center.lng });
  }, [userLocation, members, findNearestHelpCenter, setMapMode]);

  return (
    <>
    <div className="flex flex-col h-[83vh] bg-background">
      {/* Status Panel */}
      <div className="px-4 py-3 bg-card border-b border-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-card-foreground">{t('groupStatus')}</h2>
              <p className="text-sm text-muted-foreground">{members.length} {t('members')}</p>
            </div>
          </div>
          <StatusIndicator status={groupStatus} />
        </div>
      </div>

      {/* Geofence Alert */}
      {showGeofenceAlert && (
        <div className="p-4">
          <Alert className="border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              अर्जुन {t('safe')} क्षेत्र से बाहर गए हैं
              <Button
                variant="outline"
                size="sm"
                className="ml-2 h-6 px-2 text-xs border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                onClick={() => setShowGeofenceAlert(false)}
              >
                {t('viewMap')}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Leaflet Map */}
      <div className="flex-1 z-[1]">
        {/* Selected member history panel */}
        {selectedMember && selectedMember.path && (
          <div className="absolute top-4 right-4 z-[999] bg-card border border-card-border rounded-md shadow-medium max-w-[260px]">
            <div className="p-3 border-b border-card-border font-medium">{selectedMember.name} - Recent locations</div>
            <div className="p-3 max-h-48 overflow-auto space-y-2 text-sm">
              {[...selectedMember.path].slice(-10).reverse().map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(p.ts).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="absolute bottom-[11rem] right-[10%] translate-x-1/2 z-[999]">
          <Button
            variant="default"
            size="sm"
            className="p-2 rounded-full shadow-md bg-[white] w-[51px] h-[51px] hover:bg-[white]"
            onClick={handleLocate}
          >
            <Locate className='!w-[50px] !h-[50px] text-blue-600' strokeWidth={2.25} />
          </Button>
        </div>

        <MapContainer
          center={[23.1765, 75.7884]}
          zoom={16}
          className="h-full w-full"
          preferCanvas={true}
          wheelDebounceTime={35}
          wheelPxPerZoomLevel={80}
          zoomAnimation={true}
          markerZoomAnimation={true}
          touchZoom={true}
          tapTolerance={15}
          whenReady={() => { /* assigned in ref below */ }}
          ref={(instance) => {
            if (instance) {
              // @ts-ignore
              mapRef.current = instance;
            }
          }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>

      {/* Bottom Actions */}
    </div>
   <div className="p-4 bg-card border-t border-card-border">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 text-primary border-primary hover:bg-primary hover:text-primary-foreground" onClick={() => { setMapMode('groups'); handleFocusGroup(); }}>
            <Navigation className="h-5 w-5 mr-2" />
            {t('focusOnGroup')}
          </Button>
          {/* <Button variant="default" className="flex-1 h-12" onClick={handleNearestHelpdesk}>
            <MapPin className="h-5 w-5 mr-2" />
            {t('nearestHelpCenter')}
          </Button> */}
          <div className="relative">
            <Button
              ref={infoButtonRef as any}
              variant="outline"
              className="h-12 px-4"
              aria-label="Group info"
              aria-haspopup="dialog"
              aria-expanded={showInfoPanel}
              aria-controls="group-info-panel"
              onClick={() => setShowInfoPanel((v) => !v)}
            >
              <Info className="h-5 w-5" />
            </Button>
            {showInfoPanel && (
              <div
                id="group-info-panel"
                ref={infoPanelRef}
                role="dialog"
                aria-modal="false"
                aria-label="Group information"
                className="absolute bottom-[3.5rem] right-0 z-[1000] bg-card border border-card-border rounded-md shadow-medium w-[90vw] max-w-[320px]"
              >
                <div className="p-3 border-b border-card-border flex items-center justify-between">
                  <div className="font-medium">{t('groupStatus')}</div>
                  <StatusIndicator status={groupStatus} />
                </div>
                <div className="p-3 space-y-2 text-sm" aria-live="polite">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('members')}</span>
                    <span className="font-medium">{totalCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Safe</span>
                    <span className="font-medium text-green-600">{safeCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Alert</span>
                    <span className="font-medium text-red-600">{alertCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="font-medium">{lastUpdatedTs ? new Date(lastUpdatedTs).toLocaleTimeString() : '—'}</span>
                  </div>
                  <div className="pt-2 border-t border-card-border">
                    <div className="font-medium mb-2">Legend</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-600" aria-hidden="true" />
                        <span className="sr-only">You marker color</span>
                        <span className="text-muted-foreground">You</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-600" aria-hidden="true" />
                        <span className="sr-only">Group member marker color</span>
                        <span className="text-muted-foreground">Group</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-600" aria-hidden="true" />
                        <span className="sr-only">SOS/alert marker color</span>
                        <span className="text-muted-foreground">SOS</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t border-card-border flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowInfoPanel(false)} aria-label="Close info panel">Close</Button>
                </div>
              </div>
            )}
          </div>
          {/* <Button variant="outline" className="h-12 px-4" onClick={() => setShowGeofenceAlert(true)}>
            <AlertCircle className="h-5 w-5" />
          </Button> */}
        </div>
      </div>
  </>
  );
};

export default memo(MapScreen);
