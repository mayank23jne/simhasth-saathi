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
const OSRM_PROFILE = (import.meta.env.VITE_OSRM_PROFILE as string | undefined) || 'driving';
const OSRM_TIMEOUT_MS = Number(import.meta.env.VITE_OSRM_TIMEOUT_MS ?? 3000);
const GH_TIMEOUT_MS = Number(import.meta.env.VITE_GRAPHOPPER_TIMEOUT_MS ?? 4500);
const MAPBOX_TIMEOUT_MS = Number(import.meta.env.VITE_MAPBOX_TIMEOUT_MS ?? 4500);

// Simple in-memory cache and in-flight de-duplication for route requests
const ROUTE_CACHE_TTL_MS = 15000; // 15s
type CacheEntry = { ts: number; result: RouteResult | null };
const routeCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<RouteResult | null>>();

function roundCoord(value: number): number {
  // round to 5 decimals (~1.1m precision)
  return Math.round(value * 1e5) / 1e5;
}

function makeKey(a: LatLng, b: LatLng): string {
  return `${roundCoord(a.lat)},${roundCoord(a.lng)};${roundCoord(b.lat)},${roundCoord(b.lng)}`;
}

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
export async function fetchOsrmRoute(origin: LatLng, dest: LatLng, signal?: AbortSignal): Promise<RouteResult | null> {
  try {
    const a = normalizeLatLng(origin);
    const b = normalizeLatLng(dest);
    // OSRM expects lng,lat
    const url = `${OSRM_BASE}/${OSRM_PROFILE}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }
    const t = setTimeout(() => ctrl.abort(), OSRM_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
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
    } finally {
      clearTimeout(t);
      if (signal) signal.removeEventListener('abort', onAbort as any);
    }
  } catch {
    return null;
  }
}

// GraphHopper API (requires key). Profile: foot
export async function fetchGraphHopperRoute(origin: LatLng, dest: LatLng, signal?: AbortSignal): Promise<RouteResult | null> {
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
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }
    const t = setTimeout(() => ctrl.abort(), GH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
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
    } finally {
      clearTimeout(t);
      if (signal) signal.removeEventListener('abort', onAbort as any);
    }
  } catch {
    return null;
  }
}

// Mapbox Directions API (requires token). Profile: walking
export async function fetchMapboxRoute(origin: LatLng, dest: LatLng, signal?: AbortSignal): Promise<RouteResult | null> {
  try {
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) return null;
    const a = normalizeLatLng(origin);
    const b = normalizeLatLng(dest);
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&access_token=${token}`;
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }
    const t = setTimeout(() => ctrl.abort(), MAPBOX_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
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
    } finally {
      clearTimeout(t);
      if (signal) signal.removeEventListener('abort', onAbort as any);
    }
  } catch {
    return null;
  }
}

export async function getBestRoute(origin: LatLng, dest: LatLng, signal?: AbortSignal): Promise<RouteResult | null> {
  if (!validateLatLng(origin) || !validateLatLng(dest)) return null;

  const key = makeKey(origin, dest);
  const now = Date.now();
  const cached = routeCache.get(key);
  if (cached && now - cached.ts < ROUTE_CACHE_TTL_MS) {
    return cached.result;
  }

  const existing = inflight.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    // Provider priority: prefer keys-backed providers first for reliability
    const providers: Array<(o: LatLng, d: LatLng, s?: AbortSignal) => Promise<RouteResult | null>> = [];
    const hasGH = !!(import.meta.env.VITE_GRAPHHOPPER_KEY as string | undefined);
    const hasMB = !!(import.meta.env.VITE_MAPBOX_TOKEN as string | undefined);
    if (hasGH) providers.push(fetchGraphHopperRoute);
    if (hasMB) providers.push(fetchMapboxRoute);
    // Always keep OSRM as a fallback last
    providers.push(fetchOsrmRoute);
    for (const fn of providers) {
      const result = await fn(origin, dest, signal);
      if (result && Array.isArray(result.coordinates) && result.coordinates.length >= 2) {
        routeCache.set(key, { ts: Date.now(), result });
        return result;
      }
    }
    const result: RouteResult | null = null;
    routeCache.set(key, { ts: Date.now(), result });
    return result;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

export function asStraightLine(origin: LatLng, dest: LatLng): RouteResult {
  const a = normalizeLatLng(origin);
  const b = normalizeLatLng(dest);
  return {
    coordinates: [a, b],
    provider: 'fallback',
  };
}


