// Lightweight routing helpers with multi-provider fallback.
// Tries OSRM (public), then GraphHopper (requires VITE_GRAPHHOPPER_KEY),
// then Mapbox (requires VITE_MAPBOX_TOKEN). Falls back to straight line if all fail.

export type LatLng = { lat: number; lng: number };

export type RouteResult = {
  coordinates: LatLng[];
  distanceMeters?: number;
  durationSeconds?: number;
  provider: 'osrm' | 'graphhopper' | 'mapbox' | 'fallback';
};

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateLatLng(input: Partial<LatLng> | null | undefined): input is LatLng {
  return !!input && isFiniteNumber(input.lat) && isFiniteNumber(input.lng);
}

function clampCoord(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

export function normalizeLatLng(input: LatLng): LatLng {
  // Keep valid ranges to prevent provider errors due to tiny numeric drift
  return {
    lat: clampCoord(input.lat, -90, 90),
    lng: clampCoord(input.lng, -180, 180),
  };
}

// OSRM HTTP API (no token needed)
export async function fetchOsrmRoute(origin: LatLng, dest: LatLng): Promise<RouteResult | null> {
  try {
    const a = normalizeLatLng(origin);
    const b = normalizeLatLng(dest);
    // OSRM expects lng,lat
    const url = `${OSRM_BASE}/foot/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    const coords = route?.geometry?.coordinates as [number, number][] | undefined;
    if (!route || !Array.isArray(coords)) return null;
    return {
      coordinates: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      provider: 'osrm',
    };
  } catch {
    return null;
  }
}

// GraphHopper API (requires key). Profile: foot
export async function fetchGraphHopperRoute(origin: LatLng, dest: LatLng): Promise<RouteResult | null> {
  try {
    const key = import.meta.env.VITE_GRAPHHOPPER_KEY as string | undefined;
    if (!key) return null;
    const a = normalizeLatLng(origin);
    const b = normalizeLatLng(dest);
    const params = new URLSearchParams({
      profile: 'foot',
      points_encoded: 'false',
      instructions: 'false',
      locale: 'en',
      key,
    });
    const url = `https://graphhopper.com/api/1/route?${params.toString()}`;
    const body = {
      points: [ [a.lng, a.lat], [b.lng, b.lat] ],
    };
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) return null;
    const data = await res.json();
    const path = data?.paths?.[0];
    const coords = path?.points?.coordinates as [number, number][] | undefined;
    if (!path || !Array.isArray(coords)) return null;
    return {
      coordinates: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceMeters: path.distance,
      durationSeconds: path.time ? Math.round(path.time / 1000) : undefined,
      provider: 'graphhopper',
    };
  } catch {
    return null;
  }
}

// Mapbox Directions API (requires token). Profile: walking
export async function fetchMapboxRoute(origin: LatLng, dest: LatLng): Promise<RouteResult | null> {
  try {
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) return null;
    const a = normalizeLatLng(origin);
    const b = normalizeLatLng(dest);
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&access_token=${token}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    const coords = route?.geometry?.coordinates as [number, number][] | undefined;
    if (!route || !Array.isArray(coords)) return null;
    return {
      coordinates: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      provider: 'mapbox',
    };
  } catch {
    return null;
  }
}

export async function getBestRoute(origin: LatLng, dest: LatLng): Promise<RouteResult | null> {
  if (!validateLatLng(origin) || !validateLatLng(dest)) return null;
  // Try in order; OSRM public first, then GH, then Mapbox
  const providers = [fetchOsrmRoute, fetchGraphHopperRoute, fetchMapboxRoute];
  for (const fn of providers) {
    const result = await fn(origin, dest);
    if (result && Array.isArray(result.coordinates) && result.coordinates.length >= 2) {
      return result;
    }
  }
  return null;
}

export function asStraightLine(origin: LatLng, dest: LatLng): RouteResult {
  const a = normalizeLatLng(origin);
  const b = normalizeLatLng(dest);
  return {
    coordinates: [a, b],
    provider: 'fallback',
  };
}


